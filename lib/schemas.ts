import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
export const idSchema = z.string().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a kebab-case ID");

export function uniqueBy<T>(items: readonly T[], key: (item: T) => string): boolean {
  return new Set(items.map(key)).size === items.length;
}

export const interestTagSchema = z.enum([
  "robots", "coding", "space", "biology", "environment", "building",
  "health", "data-math", "electronics", "security", "design",
]);

const invisibleCharacter = /[\p{Cf}\p{Cc}\p{Default_Ignorable_Code_Point}]/u;
const visibleCharacter = /[^\p{White_Space}\p{Cf}\p{Cc}\p{Default_Ignorable_Code_Point}]/u;
const interestsTextSchema = z.string()
  .transform((value) => /^\p{White_Space}*$/u.test(value) ? "" : value)
  .refine((value) => !/\p{Cs}/u.test(value), "Interests must be well-formed Unicode")
  .refine(
    (value) => !invisibleCharacter.test(value) || visibleCharacter.test(value),
    "Interests cannot consist only of invisible characters",
  )
  .pipe(z.string().trim().max(300));
const interestTagsSchema = z.array(interestTagSchema).max(8)
  .refine((tags) => uniqueBy(tags, (tag) => tag), "Interest tags must be unique");

export const interestsSchema = z.strictObject({
  interests: interestsTextSchema,
  tags: interestTagsSchema,
}).refine(
  ({ interests, tags }) => interests.length > 0 || tags.length > 0,
  { path: ["interests"], message: "Enter interests or select at least one tag" },
);

// Validate the wire format here. Catalog validation owns URL parsing and date freshness.
export const roadmapResourceSchema = z.strictObject({
  id: idSchema,
  title: text(160),
  provider: text(120),
  url: z.string().max(2048).regex(/^https:\/\/[^/?#\s\\@]+(?:[/?#][^\s\\]*)?$/i, "Expected an absolute HTTPS URL"),
  type: z.enum(["course", "video", "article", "interactive", "book"]),
  cost: z.enum(["free", "freemium", "paid"]),
  verifiedAt: z.iso.date(),
});

export const roadmapStepTextSchema = z.strictObject({
  id: idSchema,
  title: text(160),
  description: text(600).refine(
    (description) => description.split(/\s+/u).length <= 60,
    "Description must be at most 60 words",
  ),
  skills: z.array(text(80)).min(1).max(4),
  duration: text(80),
});

export const careerSummarySchema = z.strictObject({
  id: idSchema,
  title: text(160),
  summary: text(300),
  keySkills: z.array(text(80)).min(3).max(5),
});

export const recommendRequestSchema = interestsSchema;

export function createRoadmapRequestSchema(careerIds: readonly string[]) {
  const allowedIds = new Set(careerIds);
  return z.strictObject({
    careerId: idSchema.refine((id) => allowedIds.has(id), "Unknown career ID"),
    interests: interestsTextSchema.optional(),
    tags: interestTagsSchema.optional(),
  });
}

const personalizationSchema = z.enum(["none", "ai", "fallback"]);
const recommendedCareerSchema = careerSummarySchema.extend({ reason: text(220) });

export const recommendResponseSchema = z.strictObject({
  personalization: personalizationSchema,
  careers: z.array(recommendedCareerSchema).length(3)
    .refine((careers) => uniqueBy(careers, (career) => career.id), "Recommended careers must be unique"),
});

const roadmapResponseStepSchema = roadmapStepTextSchema.extend({
  order: z.int().min(1).max(6),
  resources: z.array(roadmapResourceSchema).min(1).max(3)
    .refine((resources) => uniqueBy(resources, (resource) => resource.id), "Step resources must be unique"),
});

export const roadmapResponseSchema = z.strictObject({
  personalization: personalizationSchema,
  career: careerSummarySchema.pick({ id: true, title: true }),
  steps: z.array(roadmapResponseStepSchema).min(4).max(6)
    .refine((steps) => uniqueBy(steps, (step) => step.id), "Roadmap steps must be unique")
    .refine((steps) => steps.every((step, index) => step.order === index + 1), "Roadmap steps must be in order"),
});

export const apiErrorCodeSchema = z.enum([
  "FORBIDDEN", "RATE_LIMITED", "UNSUPPORTED_MEDIA_TYPE", "PAYLOAD_TOO_LARGE",
  "INVALID_JSON", "INVALID_INPUT", "INTERNAL",
]);

export const apiErrorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: apiErrorCodeSchema,
    message: text(300),
  }),
});
