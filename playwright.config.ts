import { defineConfig, devices } from "@playwright/test";

const deploymentUrl = process.env.PLAYWRIGHT_BASE_URL;
const localUrl = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: deploymentUrl || localUrl },
  webServer: deploymentUrl
    ? undefined
    : { command: "npm run dev", url: localUrl, reuseExistingServer: !process.env.CI },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } },
  ],
});
