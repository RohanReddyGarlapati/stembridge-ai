import { afterEach, describe, expect, it, vi } from "vitest";
import { guardRequest } from "../../lib/api/guard";
import { createRateLimiter } from "../../lib/api/rateLimit";
import { readJsonBody } from "../../lib/api/readJsonBody";

vi.mock("server-only", () => ({}));
afterEach(() => vi.unstubAllEnvs());

function request(body?: BodyInit, headers: HeadersInit = {}) {
  return new Request("https://stembridge.example/api/recommend", {
    method: "POST", body, headers, duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("streaming JSON body", () => {
  it("U-API-1 accepts 4,096 actual bytes, including multibyte characters", async () => {
    const interests = "é".repeat(100);
    const json = JSON.stringify({ interests, tags: [] });
    const bytes = new TextEncoder().encode(json).byteLength;
    await expect(readJsonBody(request(json + " ".repeat(4096 - bytes)))).resolves.toEqual({ interests, tags: [] });
  });

  it("U-API-2 rejects a 4,097-byte stream without Content-Length and cancels it", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(4096));
        controller.enqueue(new Uint8Array(1));
      },
      cancel,
    });
    await expect(readJsonBody(request(stream))).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE", status: 413 });
    expect(cancel).toHaveBeenCalledOnce();
    expect(stream.locked).toBe(false);
  });

  it("U-API-3 counts 10 KB with an understated Content-Length", async () => {
    await expect(readJsonBody(request(" ".repeat(10240), { "content-length": "100" })))
      .rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE", status: 413 });
  });

  it("rejects a declared oversized body before acquiring a reader", async () => {
    const stream = new ReadableStream<Uint8Array>();
    const getReader = vi.spyOn(stream, "getReader");
    await expect(readJsonBody(request(stream, { "content-length": "4097" })))
      .rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE", status: 413 });
    expect(getReader).not.toHaveBeenCalled();
  });

  it("U-API-4 rejects invalid UTF-8 even when replacement characters would make valid JSON", async () => {
    await expect(readJsonBody(request(new Uint8Array([0x22, 0xff, 0x22]))))
      .rejects.toMatchObject({ code: "INVALID_JSON", status: 400 });
  });

  it.each(["{", "", undefined])("U-API-5 rejects malformed or absent JSON %j", async (body) => {
    await expect(readJsonBody(request(body))).rejects.toMatchObject({ code: "INVALID_JSON", status: 400 });
  });
});

describe("request guard", () => {
  const noLimit = () => 0;
  const json = { "content-type": "application/json" };

  it("U-API-6 rejects a foreign origin before counting it", () => {
    vi.stubEnv("APP_ORIGIN", "");
    const count = vi.fn(noLimit);
    expect(() => guardRequest(request("{}", { ...json, origin: "https://foreign.example" }), count))
      .toThrow(expect.objectContaining({ code: "FORBIDDEN", status: 403 }));
    expect(count).not.toHaveBeenCalled();
  });

  it("uses configured APP_ORIGIN even when the request URL differs", () => {
    vi.stubEnv("APP_ORIGIN", "https://www.stembridge.example");
    expect(() => guardRequest(request("{}", { ...json, origin: "https://www.stembridge.example" }), noLimit)).not.toThrow();
    expect(() => guardRequest(request("{}", { ...json, origin: "https://stembridge.example" }), noLimit))
      .toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("uses the incoming Host when Next constructs an internal request URL", () => {
    vi.stubEnv("APP_ORIGIN", "");
    const headers = { ...json, host: "public.example", "x-forwarded-host": "other.example" };
    expect(() => guardRequest(request("{}", { ...headers, origin: "https://public.example" }), noLimit))
      .not.toThrow();
    expect(() => guardRequest(request("{}", { ...headers, origin: "https://other.example" }), noLimit))
      .toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("U-API-7 accepts a same-origin fetch with no Origin header", () => {
    expect(() => guardRequest(request("{}", { ...json, "sec-fetch-site": "same-origin" }), noLimit)).not.toThrow();
  });

  it("U-API-8 rejects cross-site metadata even with a matching Origin", () => {
    vi.stubEnv("APP_ORIGIN", "");
    expect(() => guardRequest(request("{}", {
      ...json, origin: "https://stembridge.example", "sec-fetch-site": "cross-site",
    }), noLimit)).toThrow(expect.objectContaining({ code: "FORBIDDEN", status: 403 }));
  });

  it.each(["text/plain", "application/jsonp", "application/json, text/plain", "application/json; charset=latin1", ""])(
    "U-API-10 rejects unsupported or malformed Content-Type %j",
    (contentType) => {
      expect(() => guardRequest(request("{}", { "content-type": contentType }), noLimit))
        .toThrow(expect.objectContaining({ code: "UNSUPPORTED_MEDIA_TYPE", status: 415 }));
    },
  );

  it("ignores forwarding headers on direct hosting and uses the first valid Vercel value on Vercel", () => {
    const count = vi.fn(noLimit);
    const forwarded = request("{}", { ...json, "x-forwarded-for": "192.0.2.10, 192.0.2.11" });
    vi.stubEnv("RATE_LIMIT_PER_MIN", "");
    vi.stubEnv("VERCEL", "");
    guardRequest(forwarded, count);
    expect(count).toHaveBeenLastCalledWith("direct", 30);
    vi.stubEnv("VERCEL", "1");
    guardRequest(forwarded, count);
    expect(count).toHaveBeenLastCalledWith("192.0.2.10", 30);
    guardRequest(request("{}", { ...json, "x-forwarded-for": "invalid, 192.0.2.11" }), count);
    expect(count).toHaveBeenLastCalledWith("direct", 30);
  });
});

it("U-API-9 enforces an independent sliding window per client with Retry-After", () => {
  let now = 0;
  const take = createRateLimiter(() => now);
  expect(take("a", 2)).toBe(0);
  now = 25_000;
  expect(take("a", 2)).toBe(0);
  expect(take("a", 2)).toBe(35);
  expect(take("b", 2)).toBe(0);
  now = 60_000;
  expect(take("a", 2)).toBe(0);
  expect(take("a", 2)).toBe(25);
});
