import "server-only";
import { careersFileSchema, releaseCareersFileSchema, releaseResourcesFileSchema, resourcesFileSchema } from "./catalogSchemas";
import { interestTagSchema } from "./schemas";
import type { InterestTag } from "./types";

type DeepReadonly<T> = T extends object ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> } : T;

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

export function isCatalogSeedEnabled(): boolean {
  return process.env.CATALOG_SEED === "1"
    && (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test")
    && !process.env.CI
    && process.env.VERCEL_ENV !== "production";
}

export function loadCatalog(rawCareers: unknown, rawResources: unknown) {
  const seed = isCatalogSeedEnabled();
  const careers = (seed ? careersFileSchema : releaseCareersFileSchema).parse(rawCareers);
  const resources = (seed ? resourcesFileSchema : releaseResourcesFileSchema).parse(rawResources);
  const resourceIds = new Set(resources.map(({ id }) => id));
  const usedResourceIds = new Set<string>();
  const usedTags = new Set<InterestTag>();

  for (const career of careers) {
    for (const tag of career.tags) usedTags.add(tag);
    for (const step of career.steps) {
      for (const id of step.resourceIds) {
        if (!resourceIds.has(id)) {
          throw new Error(`Catalog career "${career.id}", step "${step.id}" references unknown resource "${id}".`);
        }
        usedResourceIds.add(id);
      }
    }
  }

  const orphanIds = resources.filter(({ id }) => !usedResourceIds.has(id)).map(({ id }) => id);
  if (orphanIds.length > 0) {
    throw new Error(`Catalog resources must be referenced by at least one step: ${orphanIds.join(", ")}.`);
  }

  if (!seed) {
    const missingTags = interestTagSchema.options.filter((tag) => !usedTags.has(tag));
    if (missingTags.length > 0) {
      throw new Error(`Catalog interest tags must be used by at least one career: ${missingTags.join(", ")}.`);
    }
  }

  const frozenCareers = deepFreeze(careers);
  const careersById = new Map(frozenCareers.map((career) => [career.id, career]));
  const resourcesById = new Map(deepFreeze(resources).map((resource) => [resource.id, resource]));
  const careerIds: readonly string[] = Object.freeze([...careersById.keys()]);
  return {
    careerIds,
    getCareer: (id: string) => careersById.get(id),
    getResource: (id: string) => resourcesById.get(id),
    listCareers: () => frozenCareers,
  };
}
