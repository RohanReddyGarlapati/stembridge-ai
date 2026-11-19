import "server-only";
import { getCareer, getResource } from "../catalog";
import type { RoadmapResponse } from "../types";

export function roadmap(careerId: string): Omit<RoadmapResponse, "personalization"> {
  const career = getCareer(careerId);
  if (!career) throw new Error(`Unknown career ID: ${careerId}`);

  return {
    career: { id: career.id, title: career.title },
    steps: career.steps.map(({ resourceIds, skills, ...step }, index) => ({
      ...step,
      skills: [...skills],
      order: index + 1,
      resources: resourceIds.map((resourceId) => {
        const resource = getResource(resourceId);
        if (!resource) throw new Error(`Missing catalog resource: ${resourceId}`);
        const { id, title, provider, url, type, cost, verifiedAt } = resource;
        return { id, title, provider, url, type, cost, verifiedAt };
      }),
    })),
  };
}
