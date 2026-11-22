import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { apiErrorResponseSchema, recommendResponseSchema, roadmapResponseSchema } from "../../lib/schemas";
import type { ApiErrorCode } from "../../lib/types";

vi.mock("server-only", () => ({}));

let recommendPost: typeof import("../../app/api/recommend/route").POST;
let roadmapPost: typeof import("../../app/api/roadmap/route").POST;
let catalog: typeof import("../../lib/catalog");
let engine: typeof import("../../lib/engine/recommend");
let client = 0;

beforeAll(async () => {
  vi.stubEnv("CATALOG_SEED", "1");
  try {
    catalog = await import("../../lib/catalog");
    engine = await import("../../lib/engine/recommend");
    ({ POST: recommendPost } = await import("../../app/api/recommend/route"));
    ({ POST: roadmapPost } = await import("../../app/api/roadmap/route"));
  } finally {
    vi.unstubAllEnvs();
  }
});

beforeEach(() => {
  client++;
  vi.stubEnv("APP_ORIGIN", "");
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("RATE_LIMIT_PER_MIN", "30");
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const input = { interests: "robots and electronics", tags: [] };

function post(path: "recommend" | "roadmap", body: BodyInit, headers: Record<string, string> = {}) {
  return new Request(`https://stembridge.example/api/${path}`, {
    method: "POST",
    body,
    headers: { "content-type": "application/json", "x-forwarded-for": `2001:db8::${client.toString(16)}`, ...headers },
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

function expectResponseHeaders(response: Response) {
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("content-type")).toMatch(/^application\/json\b/);
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(response.headers.has("set-cookie")).toBe(false);
}

async function expectApiError(response: Response, status: number, code: ApiErrorCode) {
  expect(response.status).toBe(status);
  expectResponseHeaders(response);
  const body = apiErrorResponseSchema.parse(await response.json());
  expect(body.error.code).toBe(code);
  return body;
}

it("U-RT-1 returns three distinct catalog careers and a safe aggregate log", async () => {
  const response = await recommendPost(post("recommend", JSON.stringify(input), {
    "content-type": 'Application/JSON; charset="UTF-8"',
    origin: "https://stembridge.example",
  }));
  expect(response.status).toBe(200);
  expectResponseHeaders(response);
  const body = recommendResponseSchema.parse(await response.json());
  expect(body.personalization).toBe("none");
  const ids = body.careers.map(({ id }) => id);
  expect(new Set(ids).size).toBe(3);
  expect(ids.every((id) => catalog.careerIds.includes(id))).toBe(true);
  expect(ids[0]).toBe("robotics-engineer");
  expect(JSON.parse(vi.mocked(console.info).mock.calls[0][0])).toEqual({
    route: "/api/recommend", status: 200, ms: expect.any(Number), personalization: "none", resultCount: 3,
  });
});

it("accepts a chip-only recommendation", async () => {
  const response = await recommendPost(post("recommend", JSON.stringify({ interests: "\n", tags: ["space"] })));
  expect(response.status).toBe(200);
  const body = recommendResponseSchema.parse(await response.json());
  expect(body.careers[0].reason).toBe("Matches your interest in space.");
});

it.each([
  ["U-RT-2 empty interests", { interests: "", tags: [] }],
  ["U-RT-3 long interests", { interests: "x".repeat(301), tags: [] }],
  ["U-RT-4 unknown key", { ...input, admin: true }],
  ["U-RT-5 unknown tag", { ...input, tags: ["unknown-tag"] }],
  ["U-RT-5 duplicate tags", { ...input, tags: ["robots", "robots"] }],
  ["U-RT-5 nine tags", { ...input, tags: ["robots", "coding", "space", "biology", "environment", "building", "health", "data-math", "electronics"] }],
  ["U-RT-6 numeric interests", { ...input, interests: 123 }],
  ["U-RT-6 array body", []],
  ["null body", null],
])("rejects %s with INVALID_INPUT", async (_, body) => {
  await expectApiError(await recommendPost(post("recommend", JSON.stringify(body))), 400, "INVALID_INPUT");
});

it.each([
  { careerId: "unknown-career" },
  { careerId: "Robotics Engineer" },
  { careerId: "robotics-engineer", unexpected: true },
  { careerId: "robotics-engineer", interests: 123 },
])("U-RT-7 rejects invalid roadmap payload %j", async (body) => {
  await expectApiError(await roadmapPost(post("roadmap", JSON.stringify(body))), 400, "INVALID_INPUT");
});

it("U-RT-8 returns the exact curated steps and resource fields", async () => {
  const careerId = "robotics-engineer";
  const response = await roadmapPost(post("roadmap", JSON.stringify({ careerId })));
  expect(response.status).toBe(200);
  expectResponseHeaders(response);
  const raw: unknown = await response.json();
  const body = roadmapResponseSchema.parse(raw);
  expect(raw).toEqual(body);
  expect(body.personalization).toBe("none");
  const source = catalog.getCareer(careerId)!;
  expect(body.career).toEqual({ id: source.id, title: source.title });
  expect(body.steps).toEqual(source.steps.map(({ resourceIds, ...step }, index) => ({
    ...step, order: index + 1,
    resources: resourceIds.map((id) => {
      const { title, provider, url, type, cost, verifiedAt } = catalog.getResource(id)!;
      return { id, title, provider, url, type, cost, verifiedAt };
    }),
  })));
});

it.each([
  ["malformed JSON", "{", {}, 400, "INVALID_JSON"],
  ["invalid UTF-8", new Uint8Array([0x22, 0xff, 0x22]), {}, 400, "INVALID_JSON"],
  ["oversized body", " ".repeat(4097), { "content-length": "100" }, 413, "PAYLOAD_TOO_LARGE"],
  ["wrong content type", JSON.stringify(input), { "content-type": "text/plain" }, 415, "UNSUPPORTED_MEDIA_TYPE"],
  ["foreign origin", JSON.stringify(input), { origin: "https://foreign.example" }, 403, "FORBIDDEN"],
] satisfies [string, BodyInit, Record<string, string>, number, ApiErrorCode][])(
  "returns a structured error for %s",
  async (_, body, headers, status, code) => {
    await expectApiError(await recommendPost(post("recommend", body, headers)), status, code);
    await expectApiError(await roadmapPost(post("roadmap", body, headers)), status, code);
  },
);

it("returns 429 and Retry-After for the same client across the two handlers", async () => {
  vi.stubEnv("RATE_LIMIT_PER_MIN", "1");
  expect((await recommendPost(post("recommend", JSON.stringify(input)))).status).toBe(200);
  const limited = await roadmapPost(post("roadmap", JSON.stringify({ careerId: "robotics-engineer" })));
  await expectApiError(limited, 429, "RATE_LIMITED");
  expect(Number(limited.headers.get("retry-after"))).toBeGreaterThanOrEqual(1);
  expect(Number(limited.headers.get("retry-after"))).toBeLessThanOrEqual(60);
});

it("U-RT-9 returns a generic error without leaking inputs, engine errors or client IPs", async () => {
  const interests = "private student text";
  vi.spyOn(engine, "recommend").mockImplementationOnce(() => {
    throw new Error(`internal diagnostics: ${interests}`);
  });
  const response = await recommendPost(post("recommend", JSON.stringify({ ...input, interests })));
  expect(await expectApiError(response, 500, "INTERNAL")).toEqual({
    error: { code: "INTERNAL", message: "Something went wrong. Please try again." },
  });
  expect(JSON.parse(vi.mocked(console.info).mock.calls[0][0])).toEqual({
    route: "/api/recommend", status: 500, ms: expect.any(Number), personalization: "none", resultCount: 0,
  });
});

it("fails closed when an engine returns an invalid success response", async () => {
  vi.spyOn(engine, "recommend").mockReturnValueOnce([]);
  await expectApiError(await recommendPost(post("recommend", JSON.stringify(input))), 500, "INTERNAL");
});
