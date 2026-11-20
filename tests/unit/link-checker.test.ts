import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkLinks, httpsTransport, type LinkTransport } from "../../scripts/link-checker";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("node:https", () => ({ request }));

const publicAddress = "93.184.216.34";
const start = "https://learn.example.org/start";

function mockTransport() {
  return {
    resolve: vi.fn<LinkTransport["resolve"]>(async () => [publicAddress]),
    get: vi.fn<LinkTransport["get"]>(async () => ({ status: 200 })),
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("link checker", () => {
  it("checks relative HTTPS redirects and strips fragments from requests", async () => {
    const transport = mockTransport();
    transport.get.mockResolvedValueOnce({ status: 302, location: "/lesson#section" });
    const [result] = await checkLinks([start], transport);
    expect(result).toMatchObject({ status: "successful", finalUrl: "https://learn.example.org/lesson" });
    expect(transport.get.mock.calls.map(([url, address]) => [url.href, address])).toEqual([
      [start, publicAddress], ["https://learn.example.org/lesson", publicAddress],
    ]);
  });

  it("checks public cross-host redirects and reports the hostname change", async () => {
    const transport = mockTransport();
    transport.get.mockResolvedValueOnce({ status: 301, location: "https://other.example.org/lesson" });
    const [result] = await checkLinks([start], transport);
    expect(result).toMatchObject({
      status: "inconclusive",
      finalUrl: "https://other.example.org/lesson",
      reason: expect.stringContaining("learn.example.org → other.example.org"),
    });
    expect(transport.resolve).toHaveBeenLastCalledWith("other.example.org", expect.any(AbortSignal));
  });

  it.each([
    "http://learn.example.org/", "https://user:secret@learn.example.org/",
    "https://localhost./", "https://a.home.arpa/", "https://127.1/",
    "https://0x7f000001/", "https://[::ffff:c0a8:1]/", "https://[fd00::1]/",
  ])("rejects an unsafe destination before DNS or HTTPS (%s)", async (url) => {
    const transport = mockTransport();
    expect(await checkLinks([url], transport)).toEqual([
      expect.objectContaining({ status: "failed" }),
    ]);
    expect(transport.resolve).not.toHaveBeenCalled();
    expect(transport.get).not.toHaveBeenCalled();
  });

  it.each(["http://learn.example.org/", "//169.254.169.254/", "https://a.local/"])(
    "does not follow an unsafe redirect (%s)", async (location) => {
      const transport = mockTransport();
      transport.get.mockResolvedValueOnce({ status: 302, location });
      const [result] = await checkLinks([start], transport);
      expect(result).toMatchObject({ status: "failed", reason: "unsafe redirect destination" });
      expect(transport.get).toHaveBeenCalledTimes(1);
    },
  );

  it("rechecks the DNS answers for each hop and blocks mixed public and private results", async () => {
    const transport = mockTransport();
    transport.get.mockResolvedValueOnce({ status: 302, location: "/next" });
    transport.resolve.mockResolvedValueOnce([publicAddress]).mockResolvedValueOnce([publicAddress, "10.0.0.1"]);
    const [result] = await checkLinks([start], transport);
    expect(result).toMatchObject({ status: "failed", reason: "hostname resolved to a non-public address" });
    expect(transport.resolve).toHaveBeenCalledTimes(2);
    expect(transport.get).toHaveBeenCalledTimes(1);
  });

  it("bounds redirect loops and long chains", async () => {
    const transport = mockTransport();
    transport.get.mockResolvedValueOnce({ status: 302, location: "/start#loop" });
    const [loop] = await checkLinks([start], transport);
    expect(loop).toMatchObject({ status: "failed", reason: "redirect loop" });
    expect(transport.get).toHaveBeenCalledTimes(1);

    transport.get.mockClear().mockImplementation(async (url) => ({ status: 307, location: url.pathname + "/next" }));
    const [chain] = await checkLinks([start], transport);
    expect(chain).toMatchObject({ status: "failed", reason: "redirect limit exceeded" });
    expect(transport.get).toHaveBeenCalledTimes(6);
  });

  it.each([[404, "failed"], [410, "failed"], [401, "inconclusive"], [403, "inconclusive"], [429, "inconclusive"]])(
    "reports HTTP %s as %s without an immediate retry", async (status, expected) => {
      const transport = mockTransport();
      transport.get.mockResolvedValue({ status });
      const [result] = await checkLinks([start], transport);
      expect(result).toMatchObject({ status: expected, reason: `HTTP ${status}` });
      expect(transport.get).toHaveBeenCalledTimes(1);
    },
  );

  it("retries a transient HTTP error once", async () => {
    vi.useFakeTimers();
    const transport = mockTransport();
    transport.get.mockResolvedValueOnce({ status: 503 });
    const pending = checkLinks([start], transport);
    await vi.runAllTimersAsync();
    expect(await pending).toEqual([expect.objectContaining({ status: "successful", reason: "HTTP 200 (after retry)" })]);
    expect(transport.get).toHaveBeenCalledTimes(2);
  });

  it("reports persistent connection errors as inconclusive", async () => {
    vi.useFakeTimers();
    const transport = mockTransport();
    transport.get.mockRejectedValue(Object.assign(new Error("socket reset"), { code: "ECONNRESET" }));
    const pending = checkLinks([start], transport);
    await vi.runAllTimersAsync();
    expect(await pending).toEqual([expect.objectContaining({
      status: "inconclusive", reason: "connection or DNS error (after retry)",
    })]);
    expect(transport.get).toHaveBeenCalledTimes(2);
  });

  it.each(["resolve", "get"] as const)("times out and cancels stalled %s attempts", async (stage) => {
    vi.useFakeTimers();
    const transport = mockTransport();
    const waitForAbort = (signal: AbortSignal): Promise<never> => new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    });
    if (stage === "resolve") transport.resolve.mockImplementation((_host, signal) => waitForAbort(signal));
    else transport.get.mockImplementation((_url, _address, signal) => waitForAbort(signal));

    const pending = checkLinks([start], transport);
    await vi.runAllTimersAsync();
    expect(await pending).toEqual([expect.objectContaining({
      status: "inconclusive", reason: "timed out after 10 seconds (after retry)",
    })]);
    expect(transport[stage]).toHaveBeenCalledTimes(2);
    if (stage === "resolve") expect(transport.get).not.toHaveBeenCalled();
  });

  it("runs at most four checks concurrently and preserves catalog order", async () => {
    const transport = mockTransport();
    const urls = Array.from({ length: 7 }, (_, index) => `https://learn.example.org/${index}`);
    const finish = new Map<string, () => void>();
    transport.get.mockImplementation((url) => new Promise((resolve) => {
      finish.set(url.href, () => resolve({ status: 200 }));
    }));

    const pending = checkLinks(urls, transport);
    await vi.waitFor(() => expect(finish.size).toBe(4));
    expect(transport.get).toHaveBeenCalledTimes(4);
    for (const url of [urls[2], urls[0], urls[1]]) finish.get(url)?.();
    await vi.waitFor(() => expect(finish.size).toBe(7));
    for (const url of urls.slice(3).reverse()) finish.get(url)?.();
    expect((await pending).map(({ url }) => url)).toEqual(urls);
  });

  it("pins the HTTPS connection to the vetted address while retaining host and TLS verification", async () => {
    const response = { statusCode: 200, headers: {}, destroy: vi.fn() };
    request.mockImplementation((_options, callback: (res: typeof response) => void) =>
      Object.assign(new EventEmitter(), { end: () => callback(response) }));
    const signal = new AbortController().signal;
    await expect(httpsTransport.get(new URL(start), publicAddress, signal)).resolves.toMatchObject({ status: 200 });
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      hostname: publicAddress, method: "GET", path: "/start", agent: false,
      headers: expect.objectContaining({ Host: "learn.example.org" }),
      servername: "learn.example.org", rejectUnauthorized: true, signal,
      checkServerIdentity: expect.any(Function),
    }), expect.any(Function));
    expect(response.destroy).toHaveBeenCalledOnce();
  });
});
