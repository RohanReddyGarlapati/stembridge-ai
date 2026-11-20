import { afterEach, expect, it, vi } from "vitest";
import { fetchRecommendations, fetchRoadmap, requestFailure } from "../../lib/client/apiClient";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it("sends the documented roadmap body with POST and an abort signal", async () => {
  const fetch = vi.fn(async () => Response.json({}, { status: 500 }));
  vi.stubGlobal("fetch", fetch);
  await expect(fetchRoadmap("robotics-engineer", new AbortController().signal)).rejects.toThrow(/try again/i);
  expect(fetch).toHaveBeenCalledWith("/api/roadmap", expect.objectContaining({
    method: "POST", body: '{"careerId":"robotics-engineer"}', signal: expect.any(AbortSignal),
  }));
});

it.each([
  [429, {}, /too many requests/i],
  [400, { error: { code: "INVALID_INPUT", message: "Server detail" } }, /check your interests or career selection/i],
  [200, { careers: [] }, /couldn’t load/i],
])("handles response status %s or malformed success data", async (status, body, message) => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(body, { status })));
  await expect(fetchRecommendations({ interests: "robots", tags: [] }, new AbortController().signal)).rejects.toThrow(message);
});

function pendingFetch() {
  return vi.fn((_, { signal }: RequestInit) => new Promise((_, reject) => {
    signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
  }));
}

it("works without AbortSignal.any or timeout and forwards external aborts", async () => {
  vi.stubGlobal("AbortSignal", class LegacyAbortSignal {});
  const fetch = pendingFetch();
  vi.stubGlobal("fetch", fetch);
  const caller = new AbortController();
  const add = vi.spyOn(caller.signal, "addEventListener");
  const remove = vi.spyOn(caller.signal, "removeEventListener");
  const next = fetchRoadmap("robotics-engineer", caller.signal);
  caller.abort();
  await expect(next).rejects.toMatchObject({ name: "AbortError" });
  expect(fetch.mock.calls[0][1].signal?.aborted).toBe(true);
  expect(remove).toHaveBeenCalledWith("abort", add.mock.calls[0][1]);
});

it("does not fetch when the external signal is already aborted", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const caller = new AbortController();
  caller.abort();
  await expect(fetchRoadmap("robotics-engineer", caller.signal)).rejects.toMatchObject({ name: "AbortError" });
  expect(fetch).not.toHaveBeenCalled();
});

it("aborts at ten seconds and removes the external listener", async () => {
  vi.useFakeTimers();
  const fetch = pendingFetch();
  vi.stubGlobal("fetch", fetch);
  const caller = new AbortController();
  const remove = vi.spyOn(caller.signal, "removeEventListener");
  const pending = expect(fetchRoadmap("robotics-engineer", caller.signal)).rejects.toThrow(/taking longer/i);
  await vi.advanceTimersByTimeAsync(9_999);
  expect(fetch.mock.calls[0][1].signal?.aborted).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  await pending;
  expect(fetch.mock.calls[0][1].signal?.aborted).toBe(true);
  expect(remove).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it("sanitizes network errors and cleans up listeners and timers", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("internal network diagnostic")));
  const caller = new AbortController();
  const remove = vi.spyOn(caller.signal, "removeEventListener");
  await expect(fetchRoadmap("robotics-engineer", caller.signal)).rejects.toThrow("Couldn’t connect. Check your connection and try again.");
  expect(remove).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it("handles controller initialization failures inside the client error boundary", async () => {
  const caller = new AbortController();
  vi.stubGlobal("AbortController", class {
    constructor() { throw new Error("private browser diagnostic"); }
  });
  await expect(fetchRoadmap("robotics-engineer", caller.signal)).rejects.toThrow("Something went wrong. Please try again.");
  expect(requestFailure(new Error("private diagnostic")).message).toBe("Something went wrong. Please try again.");
});

it.each(["15", "Wed, 01 Jan 2025 00:00:15 GMT"])("honors Retry-After %s", async (header) => {
  vi.useFakeTimers();
  const now = Date.parse("2025-01-01T00:00:00Z");
  vi.setSystemTime(now);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 429, headers: { "Retry-After": header } })));
  const failure = await fetchRoadmap("robotics-engineer", new AbortController().signal).catch(requestFailure);
  expect(failure).toEqual({ message: "Too many requests. Try again in about 15 seconds.", retryAt: now + 15_000 });
});

it("gives generic wait guidance for an invalid Retry-After value", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 429, headers: { "Retry-After": "-5" } })));
  const failure = await fetchRoadmap("robotics-engineer", new AbortController().signal).catch(requestFailure);
  expect(failure).toEqual({ message: "Too many requests. Please wait a moment before trying again.", retryAt: null });
});
