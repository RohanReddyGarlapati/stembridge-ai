import "server-only";
import { BlockList, isIP } from "node:net";
import { URL, URLSearchParams } from "node:url";
import { z } from "zod";
import {
  careerSummarySchema, idSchema, interestTagSchema, roadmapResourceSchema, roadmapStepTextSchema, uniqueBy,
} from "./schemas";

const localAddresses = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.168.0.0", 16], ["224.0.0.0", 3],
] as const) {
  localAddresses.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 96], ["fc00::", 7], ["fe80::", 10], ["fec0::", 10], ["ff00::", 8],
] as const) {
  localAddresses.addSubnet(network, prefix, "ipv6");
}

function isLocalHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$|\.$/g, "");
  const family = isIP(host);
  if (family) return localAddresses.check(host, family === 4 ? "ipv4" : "ipv6");
  return !host.includes(".") || /(?:^|\.)(?:localhost|local|home\.arpa)$/i.test(host);
}

function hasTracking(params: URLSearchParams): boolean {
  return Array.from(params.keys()).some((name) => /^utm_/i.test(name));
}

const catalogUrlSchema = roadmapResourceSchema.shape.url.pipe(z.string().superRefine((value, ctx) => {
  const url = URL.parse(value);
  if (!url || url.protocol !== "https:") {
    ctx.addIssue({ code: "invalid_format", format: "url", message: "Expected a valid absolute HTTPS URL" });
    return;
  }
  if (url.username || url.password || isLocalHost(url.hostname)) {
    ctx.addIssue({ code: "custom", message: "Resource URLs must use a public host without credentials" });
  }
  const fragmentSections = url.hash.slice(1).split(/[?#]/);
  if (hasTracking(url.searchParams) || fragmentSections.some((section) => hasTracking(new URLSearchParams(section)))) {
    ctx.addIssue({ code: "custom", message: "Resource URLs must not contain UTM tracking parameters" });
  }
}));

export const resourceSchema = roadmapResourceSchema.extend({
  url: catalogUrlSchema,
  level: z.enum(["beginner", "intermediate"]),
  verifiedAt: roadmapResourceSchema.shape.verifiedAt.refine(
    (date) => date <= new Date().toISOString().slice(0, 10),
    "Verification date must not be in the future",
  ),
});

export const roadmapStepSchema = roadmapStepTextSchema.extend({
  resourceIds: z.array(idSchema).min(1).max(3)
    .refine((ids) => uniqueBy(ids, (id) => id), "Resource IDs must be unique within a step"),
});

export const careerSchema = careerSummarySchema.extend({
  field: z.enum(["technology", "engineering", "science", "health"]),
  tags: z.array(interestTagSchema).min(2).max(5)
    .refine((tags) => uniqueBy(tags, (tag) => tag), "Career tags must be unique"),
  steps: z.array(roadmapStepSchema).min(4).max(6)
    .refine((steps) => uniqueBy(steps, (step) => step.id), "Step IDs must be unique within a career"),
});

function urlWithoutFragment(value: string): string {
  const url = URL.parse(value);
  if (!url) return value;
  url.hash = "";
  return url.href;
}

// The base file schemas also accept the smaller development seed catalog.
export const careersFileSchema = z.array(careerSchema).min(1).max(8)
  .refine((careers) => uniqueBy(careers, (career) => career.id), "Career IDs must be unique");

export const resourcesFileSchema = z.array(resourceSchema).min(1).max(35)
  .refine((resources) => uniqueBy(resources, (resource) => resource.id), "Resource IDs must be unique")
  .refine((resources) => uniqueBy(resources, ({ url }) => urlWithoutFragment(url)), "Resource URLs must be unique");

export const releaseCareersFileSchema = careersFileSchema.min(6);
export const releaseResourcesFileSchema = resourcesFileSchema.min(25)
  .refine(
    (resources) => resources.every(({ url }) => !/(^|\.)example\.com\.?$/i.test(URL.parse(url)?.hostname ?? "")),
    { message: "Release resources must not use example.com URLs", params: { constraint: "no-placeholder-urls" } },
  );
