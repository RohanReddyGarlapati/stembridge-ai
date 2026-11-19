import { createPostHandler } from "../../../lib/api/responses";
import { recommend } from "../../../lib/engine/recommend";
import { recommendRequestSchema, recommendResponseSchema } from "../../../lib/schemas";

export const runtime = "nodejs";

export const POST = createPostHandler(
  "/api/recommend", recommendRequestSchema, recommendResponseSchema,
  (input) => {
    const careers = recommend(input);
    return { body: { personalization: "none", careers }, resultCount: careers.length };
  },
);
