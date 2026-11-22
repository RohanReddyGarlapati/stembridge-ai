import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import careersJson from "../../data/careers.json";
import resourcesJson from "../../data/resources.json";
import { isCatalogSeedEnabled, loadCatalog } from "../../lib/catalogLoader";
import { interestTagSchema } from "../../lib/schemas";

vi.mock("server-only", () => ({}));
afterEach(() => vi.unstubAllEnvs());

const seedEnabled = isCatalogSeedEnabled();

function expectCatalogIssue(load: () => unknown, issue: Partial<ZodError["issues"][number]>) {
  try {
    load();
  } catch (error) {
    if (!(error instanceof ZodError)) throw error;
    expect(error.issues).toContainEqual(expect.objectContaining(issue));
    return;
  }
  expect.fail("Expected the catalog loader to reject the input with a Zod issue");
}

function localSeedMode() {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("CATALOG_SEED", "1");
  vi.stubEnv("CI", undefined);
  vi.stubEnv("VERCEL_ENV", undefined);
}

// Synthetic fixtures exercise the release rules without representing real educational links.
function releaseFixture() {
  const resources = Array.from({ length: 25 }, (_, i) => ({
    ...resourcesJson[0], id: `fixture-resource-${i}`, url: `https://example.org/catalog-test/${i}`,
  }));
  const careers = Array.from({ length: 6 }, (_, i) => ({
    ...careersJson[0],
    id: `fixture-career-${i}`,
    tags: [interestTagSchema.options[i], interestTagSchema.options[i + 5]],
    steps: Array.from({ length: 5 }, (_, j) => ({
      ...careersJson[0].steps[0], id: `fixture-step-${j}`, resourceIds: [resources[(i * 5 + j) % 25].id],
    })),
  }));
  return { careers, resources };
}

describe("catalog integrity", () => {
  it("U-CAT-1 loads both bundled files and exposes stable lookups in catalog order", async () => {
    localSeedMode();
    const { careerIds, listCareers, getCareer, getResource } = await import("../../lib/catalog");
    expect(careerIds).toEqual(careersJson.map(({ id }) => id));
    expect(listCareers()).toEqual(careersJson);
    for (const career of listCareers()) expect(getCareer(career.id)).toBe(career);
    for (const resource of resourcesJson) expect(getResource(resource.id)).toEqual(resource);
    expect(getCareer("unknown")).toBeUndefined();
  });

  it("U-CAT-2 requires unique kebab-case IDs within each documented scope", () => {
    localSeedMode();
    expectCatalogIssue(() => loadCatalog([careersJson[0], careersJson[0]], resourcesJson), { code: "custom", path: [] });
    const duplicateResources = [resourcesJson[0], { ...resourcesJson[1], id: resourcesJson[0].id }];
    expectCatalogIssue(() => loadCatalog(careersJson, duplicateResources), { code: "custom", path: [] });
    expectCatalogIssue(() => loadCatalog([{ ...careersJson[0], id: "Bad ID" }], resourcesJson), {
      code: "invalid_format", format: "regex", path: [0, "id"],
    });
    const duplicateStep = structuredClone(careersJson);
    duplicateStep[0].steps[1].id = duplicateStep[0].steps[0].id;
    expectCatalogIssue(() => loadCatalog(duplicateStep, resourcesJson), { code: "custom", path: [0, "steps"] });
    const duplicateRef = structuredClone(careersJson);
    const id = duplicateRef[0].steps[0].resourceIds[0];
    duplicateRef[0].steps[0].resourceIds = [id, id];
    expectCatalogIssue(() => loadCatalog(duplicateRef, resourcesJson), { code: "custom", path: [0, "steps", 0, "resourceIds"] });
  });

  it("U-CAT-3 resolves step resource IDs through the catalog index", () => {
    localSeedMode();
    const catalog = loadCatalog(careersJson, resourcesJson);
    for (const career of careersJson) {
      for (const step of career.steps) {
        for (const id of step.resourceIds) expect(catalog.getResource(id)?.id).toBe(id);
      }
    }
    expect(catalog.getResource("unknown")).toBeUndefined();
  });

  it("U-CAT-4 rejects an orphan resource", () => {
    localSeedMode();
    const { careers, resources } = releaseFixture();
    expect(() => loadCatalog(careers, [...resources, {
      ...resources[0], id: "orphan-resource", url: "https://example.org/catalog-test/orphan",
    }])).toThrow(/must be referenced.*orphan-resource/);
  });

  it("U-CAT-5 requires unique HTTPS URLs without tracking parameters", () => {
    localSeedMode();
    const { careers, resources } = releaseFixture();
    const loadWithUrl = (url: string) => loadCatalog(careers, [{ ...resources[0], url }, ...resources.slice(1)]);
    expectCatalogIssue(() => loadWithUrl("http://example.org/lesson"), {
      code: "invalid_format", path: [0, "url"],
    });
    expectCatalogIssue(() => loadWithUrl("https://example.org/lesson?utm_source=test"), { code: "custom", path: [0, "url"] });
    expectCatalogIssue(() => loadWithUrl(`${resources[1].url}#section`), { code: "custom", path: [] });
  });

  it("U-CAT-6 enforces roadmap length, resource counts and description limits", () => {
    localSeedMode();
    const { careers, resources } = releaseFixture();
    const [career, ...remainingCareers] = careers;
    const [step, ...remainingSteps] = career.steps;
    const loadWithSteps = (steps: typeof career.steps) => loadCatalog([{ ...career, steps }, ...remainingCareers], resources);
    expectCatalogIssue(() => loadWithSteps(career.steps.slice(0, 3)), {
      code: "too_small", minimum: 4, path: [0, "steps"],
    });
    expectCatalogIssue(() => loadWithSteps([...career.steps, { ...step, id: "step-6" }, { ...step, id: "step-7" }]), {
      code: "too_big", maximum: 6, path: [0, "steps"],
    });
    expectCatalogIssue(() => loadWithSteps([{ ...step, resourceIds: [] }, ...remainingSteps]), {
      code: "too_small", minimum: 1, path: [0, "steps", 0, "resourceIds"],
    });
    expectCatalogIssue(() => loadWithSteps([{ ...step, resourceIds: resources.slice(0, 4).map(({ id }) => id) }, ...remainingSteps]), {
      code: "too_big", maximum: 3, path: [0, "steps", 0, "resourceIds"],
    });
    expectCatalogIssue(() => loadWithSteps([{ ...step, description: "word ".repeat(61) }, ...remainingSteps]), {
      code: "custom", path: [0, "steps", 0, "description"],
    });
  });

  it("U-CAT-7 accepts only enum tags and rejects a release catalog with an unused tag", () => {
    vi.stubEnv("CATALOG_SEED", undefined);
    const { careers, resources } = releaseFixture();
    expect(() => loadCatalog(careers, resources)).not.toThrow();
    expectCatalogIssue(() => loadCatalog([{ ...careers[0], tags: ["not-an-interest", "design"] }, ...careers.slice(1)], resources), {
      code: "invalid_value", path: [0, "tags", 0],
    });
    careers[0].tags[0] = "design";
    expect(() => loadCatalog(careers, resources)).toThrow(/must be used.*robots/);
  });

  it("U-CAT-8 requires valid ISO verification dates no later than today", () => {
    localSeedMode();
    const { careers, resources } = releaseFixture();
    const loadWithDate = (verifiedAt: string) => loadCatalog(careers, [{ ...resources[0], verifiedAt }, ...resources.slice(1)]);
    expectCatalogIssue(() => loadWithDate("2025-02-30"), { code: "invalid_format", format: "date", path: [0, "verifiedAt"] });
    expectCatalogIssue(() => loadWithDate("9999-01-01"), { code: "custom", path: [0, "verifiedAt"] });
  });

  it("U-CAT-9 identifies the career and step with a dangling resource ID", () => {
    localSeedMode();
    const careers = structuredClone(careersJson);
    const step = careers[0].steps[0];
    step.resourceIds = ["missing-resource"];
    expect(() => loadCatalog(careers, resourcesJson)).toThrow(
      `Catalog career "${careers[0].id}", step "${step.id}" references unknown resource "missing-resource".`,
    );
  });

  it.skipIf(seedEnabled)("U-CAT-R1 validates the real files in release mode", () => {
    const catalog = loadCatalog(careersJson, resourcesJson);
    expect(catalog.listCareers().length).toBeGreaterThanOrEqual(6);
    expect(resourcesJson.length).toBeGreaterThanOrEqual(25);
  });
});

describe("catalog loading modes", () => {
  it("allows a small catalog with placeholder URLs in local seed mode", () => {
    localSeedMode();
    const { careers, resources } = releaseFixture();
    const seedResources = resources.slice(0, 5).map((resource) => ({
      ...resource, url: `https://example.com/stembridge-seed/${resource.id}`,
    }));
    const catalog = loadCatalog(careers.slice(0, 1), seedResources);
    expect(catalog.careerIds).toEqual([careers[0].id]);
    for (const resource of seedResources) expect(catalog.getResource(resource.id)).toEqual(resource);
  });

  it("protects shared lookup records and nested arrays without freezing the input", () => {
    localSeedMode();
    const { careers, resources } = releaseFixture();
    const catalog = loadCatalog(careers, resources);
    const career = catalog.listCareers()[0];
    const step = career.steps[0];
    const resource = catalog.getResource(step.resourceIds[0])!;

    for (const record of [catalog.listCareers(), catalog.careerIds, career, career.tags, career.keySkills, career.steps,
      step, step.skills, step.resourceIds, resource]) {
      expect(Object.isFrozen(record)).toBe(true);
    }
    expect(Reflect.set(career, "title", "Changed")).toBe(false);
    expect(Reflect.set(step.resourceIds, "0", "missing-resource")).toBe(false);
    expect(Reflect.set(resource, "url", "https://example.org/changed")).toBe(false);
    expect(catalog.getCareer(career.id)).toBe(career);
    expect(catalog.getResource(step.resourceIds[0])).toBe(resource);
    expect(Object.isFrozen(careers[0].steps[0])).toBe(false);
    expect(Object.isFrozen(resources[0])).toBe(false);
  });

  it("rejects incomplete data and independently rejects example.com at release size with the seed flag in production", () => {
    localSeedMode();
    vi.stubEnv("NODE_ENV", "production");
    const { careers, resources } = releaseFixture();
    expectCatalogIssue(() => loadCatalog(careers.slice(0, 3), resources), { code: "too_small", minimum: 6, path: [] });
    expectCatalogIssue(() => loadCatalog(careers, resources.slice(0, 6)), { code: "too_small", minimum: 25, path: [] });
    resources[0].url = "https://example.com/catalog-test/placeholder";
    expectCatalogIssue(() => loadCatalog(careers, resources), {
      code: "custom", path: [], params: { constraint: "no-placeholder-urls" },
    });
  });

  it.each([
    ["CATALOG_SEED", undefined],
    ["CATALOG_SEED", "true"],
    ["NODE_ENV", "production"],
    ["CI", "true"],
    ["VERCEL_ENV", "production"],
  ] as const)("enforces release validation when %s is %s", (key, value) => {
    localSeedMode();
    vi.stubEnv(key, value);
    expect(isCatalogSeedEnabled()).toBe(false);
    const { careers, resources } = releaseFixture();
    expectCatalogIssue(() => loadCatalog(careers.slice(0, 3), resources.slice(0, 6)), {
      code: "too_small", minimum: 6, path: [],
    });
  });
});
