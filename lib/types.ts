import type { z } from "zod";
import type {
  apiErrorCodeSchema,
  apiErrorResponseSchema,
  createRoadmapRequestSchema,
  interestsSchema,
  interestTagSchema,
  recommendRequestSchema,
  recommendResponseSchema,
  roadmapResponseSchema,
} from "./schemas";
import type { careerSchema, careersFileSchema, resourceSchema, resourcesFileSchema, roadmapStepSchema } from "./catalogSchemas";

export type InterestTag = z.infer<typeof interestTagSchema>;
export type Interests = z.infer<typeof interestsSchema>;
export type Resource = z.infer<typeof resourceSchema>;
export type RoadmapStep = z.infer<typeof roadmapStepSchema>;
export type Career = z.infer<typeof careerSchema>;
export type CareersFile = z.infer<typeof careersFileSchema>;
export type ResourcesFile = z.infer<typeof resourcesFileSchema>;
export type RecommendRequest = z.infer<typeof recommendRequestSchema>;
export type RoadmapRequest = z.infer<ReturnType<typeof createRoadmapRequestSchema>>;
export type RecommendResponse = z.infer<typeof recommendResponseSchema>;
export type RoadmapResponse = z.infer<typeof roadmapResponseSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
