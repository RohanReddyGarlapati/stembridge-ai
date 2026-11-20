import { z } from "zod";
import { idSchema } from "../lib/schemas";
import { reviewableHttpStatuses, type LinkResult, type ReviewReason } from "./link-checker";

const reviewReasons: ReviewReason[] = [
  "cross-host-redirect", ...reviewableHttpStatuses.map((status) => `http-${status}` as const),
];
const reviewSchema = z.strictObject({
  resourceId: idSchema,
  url: z.string().min(1),
  finalUrl: z.string().min(1),
  reason: z.enum(reviewReasons),
  reviewer: z.string().trim().min(1),
  reviewedOn: z.iso.date(),
  evidence: z.string().trim().min(1),
});
const reviewFileSchema = z.array(reviewSchema).max(35);
type LinkReview = z.infer<typeof reviewSchema>;

export function validateLinkReviews(
  raw: unknown,
  results: readonly (LinkResult & { resourceId: string })[],
  now = new Date(),
): ReadonlyMap<string, LinkReview> {
  const reviews = new Map<string, LinkReview>();
  const today = Date.parse(now.toISOString().slice(0, 10));
  const oldest = today - 14 * 86_400_000;
  for (const review of reviewFileSchema.parse(raw)) {
    const { resourceId, url, finalUrl, reason, reviewedOn } = review;
    if (reviews.has(resourceId)) throw new Error(`Duplicate link review for ${resourceId}.`);
    if (Date.parse(reviewedOn) < oldest || Date.parse(reviewedOn) > today) {
      throw new Error(`Link review for ${resourceId} must be dated within the last 14 days UTC.`);
    }
    const result = results.find((entry) => entry.resourceId === resourceId);
    if (result?.status !== "inconclusive" || result.url !== url || result.finalUrl !== finalUrl
      || result.reviewReason !== reason) {
      throw new Error(`Link review for ${resourceId} does not match an eligible current result.`);
    }
    reviews.set(resourceId, review);
  }
  return reviews;
}
