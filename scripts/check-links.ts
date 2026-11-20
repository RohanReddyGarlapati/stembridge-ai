import { readFile } from "node:fs/promises";
import careers from "../data/careers.json";
import resources from "../data/resources.json";
import { isCatalogSeedEnabled, loadCatalog } from "../lib/catalogLoader";
import { checkLinks } from "./link-checker";
import { validateLinkReviews } from "./link-reviews";

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 0 && (args.length !== 2 || args[0] !== "--reviews" || !args[1])) {
    throw new Error("Usage: npm run check-links -- [--reviews PATH]");
  }
  loadCatalog(careers, resources);
  if (isCatalogSeedEnabled()) {
    if (args.length) throw new Error("Manual link reviews require the release catalog.");
    console.log("Development seed catalog. Results do not establish release readiness.");
  }
  const rawReviews: unknown = args.length ? JSON.parse(await readFile(args[1], "utf8")) : [];

  const results = (await checkLinks(resources.map(({ url }) => url)))
    .map((result, index) => ({ ...result, resourceId: resources[index].id }));
  const counts = { successful: 0, failed: 0, inconclusive: 0 };
  for (const result of results) {
    counts[result.status]++;
    const final = result.finalUrl && result.finalUrl !== result.url ? ` → ${result.finalUrl}` : "";
    const review = result.reviewReason ? ` [review reason: ${result.reviewReason}]` : "";
    console.log(`[${result.status}] ${result.resourceId} ${result.url}${final} (${result.reason})${review}`);
  }
  console.log(`${counts.successful} successful, ${counts.failed} failed, ${counts.inconclusive} inconclusive. Human verification is separate.`);
  const reviews = validateLinkReviews(rawReviews, results);
  for (const review of reviews.values()) console.log(`[manually resolved] ${JSON.stringify(review)}`);
  if (reviews.size) console.log(`${counts.inconclusive - reviews.size} unresolved inconclusive checks.`);
  if (counts.failed || counts.inconclusive > reviews.size) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error("Link checker could not complete.", error);
  process.exitCode = 1;
});
