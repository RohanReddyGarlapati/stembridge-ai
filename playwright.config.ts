import { defineConfig, devices } from "@playwright/test";

const deploymentUrl = process.env.PLAYWRIGHT_BASE_URL;
const localUrl = "http://127.0.0.1:32149";
const channel = process.env.PLAYWRIGHT_BROWSER_CHANNEL;

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: deploymentUrl || localUrl, channel },
  webServer: deploymentUrl
    ? undefined
    : {
      command: "npm run dev -- --hostname 127.0.0.1 --port 32149", url: localUrl,
      reuseExistingServer: false,
      env: { CATALOG_SEED: "", AI_PROVIDER: "none", APP_ORIGIN: localUrl, RATE_LIMIT_PER_MIN: "120" },
    },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } },
  ],
});
