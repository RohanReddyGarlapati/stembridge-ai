import { ExploreFlow } from "../components/ExploreFlow";
import { isCatalogSeedEnabled } from "../lib/catalogLoader";

export default function Home() {
  const seed = isCatalogSeedEnabled();
  return (
    <main id="main-content" className="site-container" tabIndex={-1}>
      <ExploreFlow seed={seed} />
    </main>
  );
}
