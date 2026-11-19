import { createPostHandler } from "../../../lib/api/responses";
import { careerIds } from "../../../lib/catalog";
import { roadmap } from "../../../lib/engine/roadmap";
import { createRoadmapRequestSchema, roadmapResponseSchema } from "../../../lib/schemas";

export const runtime = "nodejs";

export const POST = createPostHandler(
  "/api/roadmap", createRoadmapRequestSchema(careerIds), roadmapResponseSchema,
  ({ careerId }) => {
    const result = roadmap(careerId);
    return { body: { personalization: "none", ...result }, resultCount: result.steps.length };
  },
);
