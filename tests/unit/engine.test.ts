import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCareer, getResource, listCareers } from "../../lib/catalog";
import { isCatalogSeedEnabled } from "../../lib/catalogLoader";
import { careersFileSchema, resourcesFileSchema } from "../../lib/catalogSchemas";
import { getKeywordTags } from "../../lib/engine/keywords";
import { normalize, tokenize } from "../../lib/engine/normalize";
import { recommend } from "../../lib/engine/recommend";
import { roadmap } from "../../lib/engine/roadmap";
import { createRoadmapRequestSchema, interestTagSchema, recommendRequestSchema, recommendResponseSchema, roadmapResponseSchema } from "../../lib/schemas";
import { fixtureCareers, fixtureResources } from "../fixtures/catalog";

vi.mock("server-only", () => ({}));
vi.mock("../../lib/catalog", () => ({ getCareer: vi.fn(), getResource: vi.fn(), listCareers: vi.fn() }));

beforeEach(() => {
  vi.mocked(listCareers).mockReturnValue(fixtureCareers);
  vi.mocked(getCareer).mockImplementation((id) => fixtureCareers.find((career) => career.id === id));
  vi.mocked(getResource).mockImplementation((id) => fixtureResources.find((resource) => resource.id === id));
});

describe("keyword matching", () => {
  it("U-ENG-1 normalizes case and punctuation", () => {
    expect(normalize("  ROBOTS!!! ")).toBe("robots");
  });

  it("U-ENG-2 normalizes full-width and control text while preserving Unicode letters and marks", () => {
    expect(tokenize("ＲＯＢＯＴＳ\tNASA\u0000 विज्ञान, ro\u200Bbot")).toEqual(["robots", "nasa", "विज्ञान", "robot"]);
    expect(tokenize(" \r\n !!! ")).toEqual([]);
  });

  it("U-ENG-3 maps whole-token synonyms without duplicates or partial matches", () => {
    expect(getKeywordTags(tokenize("arduino robotics robot"))).toEqual(new Set(["robots"]));
    expect(getKeywordTags(tokenize("planetarium decode __proto__ constructor"))).toEqual(new Set());
    expect(getKeywordTags(tokenize("planets NASA rocket"))).toEqual(new Set(["space"]));
  });

  it("U-CAT-7 makes every enum tag reachable through text", () => {
    const tokens = tokenize("robot programming rocket genetics climate prototype patient statistics circuit privacy sketching");
    expect(getKeywordTags(tokens)).toEqual(new Set(interestTagSchema.options));
  });

  it.each([
    ["I want to learn about AI", "data-math"],
    ["I'm curious about artificial intelligence", "data-math"],
    ["I want to try machine-learning", "data-math"],
    ["I like AI, artificial intelligence and machine learning", "data-math"],
    ["I enjoy using a computer and fixing computers", "coding"],
    ["I want to make a video game or several video games", "coding"],
    ["I want to make an app and share my apps", "coding"],
    ["I like watching an animal and learning about animals", "biology"],
    ["I love nature, the ocean, oceans and weather", "environment"],
    ["I wonder how a star and other stars form", "space"],
    ["I want to be an astronaut like other astronauts", "space"],
    ["I wonder how a satellite and other satellites work", "space"],
    ["I enjoy physics and maths", "data-math"],
    ["I want to study chemistry", "environment"],
    ["I'm interested in engineering", "building"],
    ["I want to understand a hacker, hackers and cybersecurity", "security"],
  ])("maps the student phrase %j to %s once", (phrase, tag) => {
    expect(getKeywordTags(tokenize(phrase))).toEqual(new Set([tag]));
  });

  it.each(["I like learning", "I use a machine", "I play games", "I wonder about intelligence", "My friend is a starfish"])(
    "does not match standalone ambiguous words or substrings in %j",
    (phrase) => expect(getKeywordTags(tokenize(phrase))).toEqual(new Set()),
  );
});

describe("recommendations", () => {
  it("U-ENG-4 ranks robotics and software and gives reasons based on matched tags", () => {
    const careers = recommend({ interests: "I love building robots and coding", tags: [] });
    expect(careers.map(({ id }) => id)).toEqual(["robotics-engineer", "ai-engineer", "software-engineer"]);
    expect(careers[0].reason).toBe("Matches your interest in robots and coding.");
    expect(careers[2].reason).toBe("Matches your interest in coding.");
    expect(recommendResponseSchema.parse({ personalization: "none", careers }).careers).toEqual(careers);
  });

  it.each([
    ["I want to learn about AI", "ai-engineer", "data and math"],
    ["Artificial intelligence and machine learning sound fun", "ai-engineer", "data and math"],
    ["I want to build video games and apps on computers", "software-engineer", "coding"],
    ["I like animals, nature, oceans and weather", "environmental-scientist", "the environment and biology"],
    ["I like stars, astronauts, and satellites", "robotics-engineer", "space"],
    ["I like physics and maths", "data-scientist", "data and math"],
    ["I want to explore chemistry", "environmental-scientist", "the environment"],
    ["I want to try engineering", "robotics-engineer", "building things"],
    ["I want to understand hackers and cybersecurity", "cybersecurity-analyst", "security"],
  ])("returns a relevant matched card for %j", (interests, id, label) => {
    expect(recommend({ interests, tags: [] }).find((career) => career.id === id)?.reason)
      .toBe(`Matches your interest in ${label}.`);
  });

  it("U-ENG-5 matches a selected chip with no free text", () => {
    expect(recommend({ interests: "", tags: ["space"] })[0]).toMatchObject({
      id: "robotics-engineer", reason: "Matches your interest in space.",
    });
  });

  it("U-ENG-6 gives chips twice the weight of a keyword and counts each tag once", () => {
    const careers = recommend({ interests: "arduino robotics robot", tags: ["security"] });
    expect(careers.slice(0, 2).map(({ id }) => id)).toEqual(["cybersecurity-analyst", "robotics-engineer"]);
    const overlapping = recommend({ interests: "cryptography privacy", tags: ["robots", "security"] });
    expect(overlapping[0].id).toBe("robotics-engineer");
    const aiSynonyms = recommend({ interests: "AI, artificial intelligence, machine learning", tags: ["space"] });
    expect(aiSynonyms[0].id).toBe("robotics-engineer");
  });

  it.each(["asdfgh", "", "\r\n"])("U-ENG-7 uses the same diverse fallback for %j", (interests) => {
    const careers = recommend({ interests, tags: [] });
    expect(careers.map(({ id, reason }) => [id, reason])).toEqual([
      ["software-engineer", "A great starting point if you're exploring technology."],
      ["robotics-engineer", "A great starting point if you're exploring engineering."],
      ["environmental-scientist", "A great starting point if you're exploring science."],
    ]);
  });

  it("fills remaining fallback slots in catalog order when fewer than three fields are available", () => {
    vi.mocked(listCareers).mockReturnValue(fixtureCareers.slice(0, 3));
    expect(recommend({ interests: "", tags: [] }).map(({ id }) => id)).toEqual([
      "software-engineer", "robotics-engineer", "data-scientist",
    ]);
  });

  it("fills slots after positive matches with zero-score careers in catalog order and generic reasons", () => {
    const results = recommend({ interests: "cybersecurity", tags: [] });
    expect(results.map(({ id, reason }) => [id, reason])).toEqual([
      ["cybersecurity-analyst", "Matches your interest in security."],
      ["software-engineer", "A great starting point if you're exploring technology."],
      ["robotics-engineer", "A great starting point if you're exploring engineering."],
    ]);
  });

  it("detaches recommendation cards and skill arrays from catalog records", () => {
    const source = structuredClone(fixtureCareers);
    const original = structuredClone(source);
    vi.mocked(listCareers).mockReturnValue(source);
    const input = { interests: "coding", tags: [] };
    const result = recommend(input);
    const expected = structuredClone(result);
    result[0].title = "Edited title";
    result[0].keySkills.push("Edited skill");
    result.pop();
    expect(source).toEqual(original);
    expect(recommend(input)).toEqual(expected);
  });

  it("U-ENG-8 breaks equal scores by catalog order", () => {
    expect(recommend({ interests: "coding", tags: [] }).map(({ id }) => id)).toEqual([
      "software-engineer", "robotics-engineer", "data-scientist",
    ]);
  });

  it("U-ENG-9 returns exactly three distinct catalog IDs and repeats results across 200 generated strings", () => {
    let state = 42;
    const words = ["robot", "statistics", "ecology", "security", "code", "NASA", "????", "unmatched", "design"];
    const ids = new Set(fixtureCareers.map(({ id }) => id));
    for (let run = 0; run < 200; run++) {
      const interests = Array.from({ length: run % 10 }, () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return words[state % words.length];
      }).join(" ");
      const input = { interests, tags: [] };
      const result = recommend(input);
      const selected = result.map(({ id }) => id);
      expect(selected).toHaveLength(3);
      expect(new Set(selected)).toHaveProperty("size", 3);
      expect(selected.every((id) => ids.has(id))).toBe(true);
      expect(recommend(input)).toEqual(result);
    }
  });

  it.skipIf(!isCatalogSeedEnabled())("returns three distinct catalog careers in the strict response shape", async () => {
    const catalog = await vi.importActual<typeof import("../../lib/catalog")>("../../lib/catalog");
    vi.mocked(listCareers).mockImplementation(catalog.listCareers);
    for (const interests of ["robots", "asdfgh"]) {
      const careers = recommend({ interests, tags: [] });
      const response = recommendResponseSchema.parse({ personalization: "none", careers });
      const ids = response.careers.map(({ id }) => id);
      expect(ids).toHaveLength(3);
      expect(new Set(ids)).toEqual(new Set(catalog.careerIds));
      expect(ids[0]).toBe("robotics-engineer");
      if (interests === "asdfgh") expect(ids).toEqual(catalog.careerIds);
    }
  });

  it("leaves invalid request payloads at the schema boundary", () => {
    const empty = recommendRequestSchema.safeParse({ interests: "", tags: [] });
    expect(empty.error?.issues).toContainEqual(expect.objectContaining({ code: "custom", path: ["interests"] }));
    const invalid = recommendRequestSchema.safeParse({ interests: "robots", tags: ["invalid-tag"] });
    expect(invalid.error?.issues).toContainEqual(expect.objectContaining({ code: "invalid_value", path: ["tags", 0] }));
  });
});

describe("roadmaps", () => {
  it("uses schema-valid fixture records with complete resource relationships", () => {
    const careers = careersFileSchema.parse(fixtureCareers);
    const resources = resourcesFileSchema.parse(fixtureResources);
    const refs = new Set(careers.flatMap(({ steps }) => steps.flatMap(({ resourceIds }) => resourceIds)));
    expect(refs).toEqual(new Set(resources.map(({ id }) => id)));
  });

  it("U-ENG-10 returns curated steps and resource metadata in catalog order", () => {
    const id = "robotics-engineer";
    const source = fixtureCareers.find((career) => career.id === id)!;
    const result = roadmap(id);
    expect(result.career).toEqual({ id, title: source.title });
    for (const [index, { resourceIds, ...step }] of source.steps.entries()) {
      const hydrated = result.steps[index];
      expect(hydrated).toMatchObject({ ...step, order: index + 1 });
      expect(hydrated.resources.map(({ id }) => id)).toEqual(resourceIds);
      for (const resource of hydrated.resources) {
        const catalogResource = fixtureResources.find(({ id }) => id === resource.id)!;
        expect(resource).toMatchObject({ title: catalogResource.title, url: catalogResource.url });
      }
    }
    expect(result.steps).toHaveLength(source.steps.length);
    expect(roadmapResponseSchema.parse({ personalization: "none", ...result }).steps).toEqual(result.steps);
  });

  it("U-ENG-11 rejects unknown career IDs at the schema and engine boundaries", () => {
    const schema = createRoadmapRequestSchema(fixtureCareers.map(({ id }) => id));
    expect(schema.parse({ careerId: "robotics-engineer" })).toEqual({ careerId: "robotics-engineer" });
    const result = schema.safeParse({ careerId: "unknown-career" });
    expect(result.error?.issues).toContainEqual(expect.objectContaining({ code: "custom", path: ["careerId"] }));
    expect(() => roadmap("unknown-career")).toThrow("Unknown career ID");
  });

  it("detaches roadmap steps, skills and resources from catalog records", () => {
    const id = "robotics-engineer";
    const sourceCareer = structuredClone(fixtureCareers.find((career) => career.id === id)!);
    const sourceResources = structuredClone(fixtureResources);
    const originalCareer = structuredClone(sourceCareer);
    const originalResources = structuredClone(sourceResources);
    vi.mocked(getCareer).mockReturnValue(sourceCareer);
    vi.mocked(getResource).mockImplementation((resourceId) => sourceResources.find((resource) => resource.id === resourceId));
    const result = roadmap(id);
    const expected = structuredClone(result);
    result.career.title = "Edited title";
    result.steps[0].description = "Edited description";
    result.steps[0].skills.push("Edited skill");
    result.steps[0].resources[0].title = "Edited resource";
    result.steps[0].resources.pop();
    result.steps.pop();
    expect(sourceCareer).toEqual(originalCareer);
    expect(sourceResources).toEqual(originalResources);
    expect(roadmap(id)).toEqual(expected);
  });

  it("fails closed if a catalog resource lookup unexpectedly fails", () => {
    vi.mocked(getResource).mockReturnValue(undefined);
    expect(() => roadmap("robotics-engineer")).toThrow("Missing catalog resource: seed-programming");
  });
});
