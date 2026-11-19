import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { z } from "zod";
import {
  careerSchema, careersFileSchema, releaseCareersFileSchema, releaseResourcesFileSchema,
  resourceSchema, resourcesFileSchema, roadmapStepSchema,
} from "../../lib/catalogSchemas";
import {
  apiErrorResponseSchema,
  createRoadmapRequestSchema,
  recommendRequestSchema,
  recommendResponseSchema,
  roadmapResponseSchema,
} from "../../lib/schemas";
import type { Career, InterestTag, RecommendRequest, Resource, RoadmapRequest, RoadmapResponse } from "../../lib/types";

vi.mock("server-only", () => ({}));

function expectIssue(result: z.ZodSafeParseResult<unknown>, code: string, path: (string | number)[]) {
  expect(result.success).toBe(false);
  expect(result.error?.issues).toContainEqual(expect.objectContaining({ code, path }));
}

const resource = {
  id: "intro-lesson",
  title: "Intro lesson",
  provider: "Test provider",
  url: "https://example.org/intro",
  type: "course",
  cost: "free",
  level: "beginner",
  verifiedAt: "2025-01-01",
};

const step = {
  id: "step-1",
  title: "Learn the basics",
  description: "Practice the core skills.",
  skills: ["Programming"],
  duration: "2 weeks",
  resourceIds: [resource.id],
};

const career = {
  id: "robotics-engineer",
  title: "Robotics Engineer",
  summary: "Designs and builds robots.",
  field: "engineering",
  tags: ["robots", "coding"],
  keySkills: ["Programming", "Electronics", "Design"],
  steps: Array.from({ length: 4 }, (_, index) => ({ ...step, id: `step-${index + 1}` })),
};

describe("request schemas", () => {
  it("accepts 300 characters after trimming and up to 8 distinct tags", () => {
    const interests = "a".repeat(300);
    const tags = ["robots", "coding", "space", "biology", "environment", "building", "health", "design"];
    expect(recommendRequestSchema.parse({ interests: `  ${interests}  `, tags })).toEqual({ interests, tags });
  });

  it("accepts chip-only and text-only interests", () => {
    expect(recommendRequestSchema.parse({ interests: " ", tags: ["space"] })).toEqual({ interests: "", tags: ["space"] });
    expect(recommendRequestSchema.safeParse({ interests: "robotics", tags: [] }).success).toBe(true);
  });

  it.each(["\n", "\t", " \r\n ", "\u0085\u2003"])(
    "normalizes whitespace-only interests %j with a selected tag",
    (interests) => {
      expect(recommendRequestSchema.parse({ interests, tags: ["space"] })).toEqual({ interests: "", tags: ["space"] });
    },
  );

  it.each<[string, unknown, string, (string | number)[]]>([
    ["U-RT-2 empty", { interests: "", tags: [] }, "custom", ["interests"]],
    ["U-RT-2 whitespace", { interests: "  ", tags: [] }, "custom", ["interests"]],
    ["U-RT-2 newline without tags", { interests: "\n", tags: [] }, "custom", ["interests"]],
    ["U-RT-3 301 characters", { interests: "a".repeat(301), tags: [] }, "too_big", ["interests"]],
    ["U-RT-4 extra key", { interests: "x", tags: [], admin: true }, "unrecognized_keys", []],
    ["U-RT-5 unknown tag", { interests: "x", tags: ["not-a-tag"] }, "invalid_value", ["tags", 0]],
    ["U-RT-5 duplicate tags", { interests: "x", tags: ["space", "space"] }, "custom", ["tags"]],
    ["U-RT-5 nine distinct tags", { interests: "x", tags: ["robots", "coding", "space", "biology", "environment", "building", "health", "design", "security"] }, "too_big", ["tags"]],
    ["U-RT-6 numeric interests", { interests: 123, tags: [] }, "invalid_type", ["interests"]],
    ["U-RT-6 array body", [{ interests: "x", tags: [] }], "invalid_type", []],
    ["null body", null, "invalid_type", []],
    ["boolean body", true, "invalid_type", []],
    ["number body", 1, "invalid_type", []],
    ["string body", "robots", "invalid_type", []],
    ["missing tags", { interests: "x" }, "invalid_type", ["tags"]],
    ["missing interests", { tags: ["space"] }, "invalid_type", ["interests"]],
  ])("rejects %s at the schema boundary", (_, input, code, path) => {
    expectIssue(recommendRequestSchema.safeParse(input), code, path);
  });

  it.each(["__proto__", "constructor", "prototype", "toString"])("rejects the own JSON key %s", (key) => {
    const result = recommendRequestSchema.safeParse(JSON.parse(`{"interests":"x","tags":[],"${key}":{}}`));
    expectIssue(result, "unrecognized_keys", []);
    expect(result.error?.issues[0]).toMatchObject({ keys: [key] });
  });

  it.each(["\u200B\u200D", "\u0000\u001F", "\uFEFF", "\uFE0F", "\uD800", "\uDC00", "robots\uD800"])(
    "rejects invisible or malformed Unicode %j even with a tag",
    (interests) => expectIssue(recommendRequestSchema.safeParse({ interests, tags: ["space"] }), "custom", ["interests"]),
  );

  it("preserves multilingual text and counts complete supplementary characters as one code point", () => {
    const multilingual = "علوم فارسی\u200Cزبان विज्ञान 科学 e\u0301 👩‍🔬";
    expect(recommendRequestSchema.parse({ interests: multilingual, tags: [] }).interests).toBe(multilingual);
    const interests = "🧪".repeat(300);
    expect(recommendRequestSchema.parse({ interests, tags: [] }).interests).toBe(interests);
    expectIssue(recommendRequestSchema.safeParse({ interests: interests + "a", tags: [] }), "too_big", ["interests"]);
  });

  it("requires a known kebab-case career ID and permits an ID-only roadmap request", () => {
    const schema = createRoadmapRequestSchema([career.id, "INVALID"]);
    expect(schema.parse({ careerId: career.id })).toEqual({ careerId: career.id });
    expectIssue(schema.safeParse({ careerId: "unknown-career" }), "custom", ["careerId"]);
    expectIssue(schema.safeParse({ careerId: "INVALID" }), "invalid_format", ["careerId"]);
    expectIssue(schema.safeParse({ careerId: career.id, tags: ["robots", "robots"] }), "custom", ["tags"]);
    expectIssue(schema.safeParse({ careerId: career.id, interests: "a".repeat(301) }), "too_big", ["interests"]);
    expectIssue(schema.safeParse({ careerId: career.id, extra: true }), "unrecognized_keys", []);
  });
});

describe("catalog schemas", () => {
  it("accepts valid catalog records and applies separate release minimums", () => {
    expect(careersFileSchema.parse([career])).toEqual([career]);
    expect(resourcesFileSchema.parse([resource])).toEqual([resource]);
    const careers = Array.from({ length: 6 }, (_, index) => ({ ...career, id: `career-${index}` }));
    const resources = Array.from({ length: 25 }, (_, index) => ({
      ...resource, id: `lesson-${index}`, url: `https://example.org/${index}`,
    }));
    expect(releaseCareersFileSchema.safeParse(careers).success).toBe(true);
    expect(releaseResourcesFileSchema.safeParse(resources).success).toBe(true);
    expectIssue(releaseCareersFileSchema.safeParse(careers.slice(1)), "too_small", []);
    expectIssue(releaseResourcesFileSchema.safeParse(resources.slice(1)), "too_small", []);
    const seedUrl = { ...resources[0], url: "https://example.com/seed" };
    expect(resourcesFileSchema.safeParse([seedUrl]).success).toBe(true);
    expectIssue(releaseResourcesFileSchema.safeParse([seedUrl, ...resources.slice(1)]), "custom", []);
  });

  it("rejects duplicate IDs and equivalent resource URLs", () => {
    expectIssue(careersFileSchema.safeParse([career, career]), "custom", []);
    expectIssue(resourcesFileSchema.safeParse([resource, { ...resource, url: "https://example.org/second" }]), "custom", []);
    expectIssue(resourcesFileSchema.safeParse([resource, { ...resource, id: "other", url: "https://EXAMPLE.ORG:443/intro#chapter" }]), "custom", []);
    expectIssue(careerSchema.safeParse({ ...career, steps: [...career.steps, step] }), "custom", ["steps"]);
  });

  it.each([
    [{ id: "intro--lesson" }, "invalid_format", [0, "id"]],
    [{ url: "malformed" }, "invalid_format", [0, "url"]],
    [{ url: "http://example.org/intro" }, "invalid_format", [0, "url"]],
    [{ url: "https://example.org/intro?utm_source=test" }, "custom", [0, "url"]],
    [{ verifiedAt: "2025-02-30" }, "invalid_format", [0, "verifiedAt"]],
    [{ verifiedAt: "9999-01-01" }, "custom", [0, "verifiedAt"]],
    [{ level: "advanced" }, "invalid_value", [0, "level"]],
    [{ extra: true }, "unrecognized_keys", [0]],
    [{ title: "t".repeat(161) }, "too_big", [0, "title"]],
    [{ provider: "p".repeat(121) }, "too_big", [0, "provider"]],
    [{ id: "a".repeat(81) }, "too_big", [0, "id"]],
  ] satisfies [object, string, (string | number)[]][])("rejects invalid resource fields %j", (override, code, path) => {
    expectIssue(resourcesFileSchema.safeParse([{ ...resource, ...override }]), code, path);
  });

  it.each([
    ["//example.org/intro", "invalid_format"],
    ["https:example.org/intro", "invalid_format"],
    ["https://example.org:99999/intro", "invalid_format"],
    ["https://student:secret@example.org/intro", "invalid_format"],
    ["https://127.1/intro", "custom"],
    ["https://2130706433/intro", "custom"],
    ["https://localhost./intro", "custom"],
    ["https://printer.local/intro", "custom"],
    ["https://10.0.0.1/intro", "custom"],
    ["https://172.31.0.1/intro", "custom"],
    ["https://192.168.0.1/intro", "custom"],
    ["https://169.254.0.1/intro", "custom"],
    ["https://[::1]/intro", "custom"],
    ["https://[::ffff:192.168.0.1]/intro", "custom"],
    ["https://[fd00::1]/intro", "custom"],
    ["https://[fe80::1]/intro", "custom"],
    ["https://example.org/intro#/part?%55TM_source=test", "custom"],
    ["https://example.org/intro#utm_medium=test", "custom"],
  ])("rejects unsafe catalog URL %s", (url, code) => {
    expectIssue(resourceSchema.safeParse({ ...resource, url }), code, ["url"]);
  });

  it.each([
    "https://example.org/intro?lang=en#lesson",
    "https://例え.テスト/入門",
    "HTTPS://example.org:8443/path?value=user@example.org",
    "https://172.32.0.1/intro",
    "https://8.8.8.8/",
    "https://[2606:4700:4700::1111]/",
  ])("accepts a well-formed public URL shape %s without changing it", (url) => {
    expect(resourceSchema.parse({ ...resource, url }).url).toBe(url);
  });

  it("enforces roadmap and career limits and rejects unknown nested keys", () => {
    const words = Array.from({ length: 60 }, () => "word").join(" ");
    expect(roadmapStepSchema.safeParse({ ...step, description: words }).success).toBe(true);
    expectIssue(roadmapStepSchema.safeParse({ ...step, description: `${words}\nword` }), "custom", ["description"]);
    expectIssue(roadmapStepSchema.safeParse({ ...step, description: "a".repeat(601) }), "too_big", ["description"]);
    expectIssue(roadmapStepSchema.safeParse({ ...step, skills: [] }), "too_small", ["skills"]);
    expectIssue(roadmapStepSchema.safeParse({ ...step, resourceIds: ["a", "b", "c", "d"] }), "too_big", ["resourceIds"]);
    expectIssue(careerSchema.safeParse({ ...career, tags: ["robots"] }), "too_small", ["tags"]);
    expectIssue(careerSchema.safeParse({ ...career, keySkills: ["Programming"] }), "too_small", ["keySkills"]);
    expectIssue(careerSchema.safeParse({ ...career, steps: career.steps.slice(1) }), "too_small", ["steps"]);
    expectIssue(careerSchema.safeParse({ ...career, steps: [{ ...step, extra: true }, ...career.steps.slice(1)] }), "unrecognized_keys", ["steps", 0]);
  });
});

describe("API response schemas", () => {
  it("requires exactly three distinct recommendation cards in the documented shape", () => {
    const { id, title, summary, keySkills } = career;
    const card = { id, title, summary, keySkills, reason: "Matches your interest in robots." };
    const cards = [card, { ...card, id: "software-developer" }, { ...card, id: "data-scientist" }];
    const response = { personalization: "none", careers: cards };
    expect(recommendResponseSchema.parse(response)).toEqual(response);
    expectIssue(recommendResponseSchema.safeParse({ ...response, careers: [card] }), "too_small", ["careers"]);
    expectIssue(recommendResponseSchema.safeParse({ ...response, careers: [card, card, card] }), "custom", ["careers"]);
    expectIssue(recommendResponseSchema.safeParse({ ...response, careers: [{ ...card, field: "engineering" }, ...cards.slice(1)] }), "unrecognized_keys", ["careers", 0]);
  });

  it("requires ordered roadmap steps with hydrated resource DTOs", () => {
    const { id, title, provider, url, type, cost, verifiedAt } = resource;
    const { title: stepTitle, description, skills, duration } = step;
    const response = {
      personalization: "none",
      career: { id: career.id, title: career.title },
      steps: career.steps.map(({ id }, index) => ({
        id, order: index + 1, title: stepTitle, description, skills, duration,
        resources: [{ id: resource.id, title, provider, url, type, cost, verifiedAt }],
      })),
    };
    expect(roadmapResponseSchema.parse(response)).toEqual(response);
    const [first, ...rest] = response.steps;
    expectIssue(roadmapResponseSchema.safeParse({ ...response, steps: [...rest, first] }), "custom", ["steps"]);
    expectIssue(roadmapResponseSchema.safeParse({ ...response, steps: [{ ...first, resources: [] }, ...rest] }), "too_small", ["steps", 0, "resources"]);
    expectIssue(roadmapResponseSchema.safeParse({ ...response, steps: [{ ...first, resources: [{ id }] }, ...rest] }), "invalid_type", ["steps", 0, "resources", 0, "title"]);
    const nestedExtra = { ...first.resources[0], level: "beginner" };
    expectIssue(roadmapResponseSchema.safeParse({ ...response, steps: [{ ...first, resources: [nestedExtra] }, ...rest] }), "unrecognized_keys", ["steps", 0, "resources", 0]);
    expectIssue(roadmapResponseSchema.safeParse({ ...response, steps: [{ ...first, extra: true }, ...rest] }), "unrecognized_keys", ["steps", 0]);
    expectIssue(roadmapResponseSchema.safeParse({ ...response, career: { ...response.career, extra: true } }), "unrecognized_keys", ["career"]);

    const dateOnly = { ...first.resources[0], verifiedAt: "9999-01-01" };
    vi.stubGlobal("URL", undefined);
    try {
      expect(roadmapResponseSchema.safeParse({ ...response, steps: [{ ...first, resources: [dateOnly] }, ...rest] }).success).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("accepts documented error codes and rejects extra diagnostic fields", () => {
    const response = { error: { code: "INVALID_INPUT", message: "Check your input." } };
    expect(apiErrorResponseSchema.parse(response)).toEqual(response);
    expectIssue(apiErrorResponseSchema.safeParse({ error: { ...response.error, code: "UNKNOWN" } }), "invalid_value", ["error", "code"]);
    expectIssue(apiErrorResponseSchema.safeParse({ error: { ...response.error, stack: "internal detail" } }), "unrecognized_keys", ["error"]);
  });
});

it("infers the required request fields, optional roadmap fields and public resource shape", () => {
  expectTypeOf<RecommendRequest>().toEqualTypeOf<{ interests: string; tags: InterestTag[] }>();
  expectTypeOf<RoadmapRequest>().toEqualTypeOf<{ careerId: string; interests?: string; tags?: InterestTag[] }>();
  expectTypeOf<Career["steps"][number]["resourceIds"]>().toEqualTypeOf<string[]>();
  expectTypeOf<RoadmapResponse["steps"][number]["resources"][number]>().toEqualTypeOf<Omit<Resource, "level">>();
});
