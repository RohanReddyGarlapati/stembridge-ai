import careers from "../data/careers.json";
import resources from "../data/resources.json";
import { isCatalogSeedEnabled, loadCatalog } from "../lib/catalogLoader";
import { checkLinks } from "./link-checker";

async function main() {
  loadCatalog(careers, resources);
  if (isCatalogSeedEnabled()) console.log("Development seed catalog. Results do not establish release readiness.");

  const results = await checkLinks(resources.map(({ url }) => url));
  const counts = { successful: 0, failed: 0, inconclusive: 0 };
  for (const [index, result] of results.entries()) {
    counts[result.status]++;
    const final = result.finalUrl && result.finalUrl !== result.url ? ` → ${result.finalUrl}` : "";
    console.log(`[${result.status}] ${resources[index].id} ${result.url}${final} (${result.reason})`);
  }
  console.log(`${counts.successful} successful, ${counts.failed} failed, ${counts.inconclusive} inconclusive. Human verification is separate.`);
  if (counts.failed || counts.inconclusive) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error("Link checker could not complete.", error);
  process.exitCode = 1;
});
