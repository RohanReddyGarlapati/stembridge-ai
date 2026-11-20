import { expect, test, type Page } from "@playwright/test";
import resources from "../../data/resources.json";

const textbox = (page: Page) => page.getByRole("textbox", { name: "What are you curious about?" });
const cards = (page: Page) => page.getByRole("list", { name: "Career recommendations" }).locator(":scope > li");
const appAlert = (page: Page) => page.getByRole("main").getByRole("alert");
const career = (page: Page, name: RegExp) => page.getByRole("button", { name });
const robotics = /View roadmap for Robotics Engineer/i;
const software = /View roadmap for Software Engineer/i;

async function recommend(page: Page, interests = "I like building robots and coding") {
  await textbox(page).fill(interests);
  await page.getByRole("button", { name: "Find careers" }).click();
  await expect(cards(page)).toHaveCount(3);
}

function latch() {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  return { wait, release };
}

test("E2E-1/9 shows three careers and ordered catalog links without horizontal scrolling", async ({ page }) => {
  await page.goto("/");
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    await expect(page.getByRole("complementary", { name: "Development catalog" })).toContainText("placeholder links");
  }
  await recommend(page);
  await expect(career(page, robotics)).toBeVisible();
  await career(page, robotics).click();
  const roadmap = page.getByRole("list", { name: "Roadmap steps" });
  await expect(roadmap).toBeVisible();
  const steps = roadmap.locator(":scope > li");
  if (!process.env.PLAYWRIGHT_BASE_URL) await expect(steps).toHaveCount(4);
  const count = await steps.count();
  expect(count).toBeGreaterThanOrEqual(4);
  expect(count).toBeLessThanOrEqual(6);
  const catalogUrls = new Set(resources.map(({ url }) => url));
  for (let index = 0; index < count; index++) {
    const step = steps.nth(index);
    await expect(step).toHaveAttribute("value", String(index + 1));
    const links = await step.getByRole("link").all();
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
      expect(catalogUrls.has(await link.getAttribute("href") ?? "")).toBe(true);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("ignores a double submit and keeps progress and layout consistent across views", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(AbortSignal, "any", { value: undefined, configurable: true });
    Object.defineProperty(AbortSignal, "timeout", { value: undefined, configurable: true });
  });
  await page.goto("/");
  const progress = page.getByRole("list", { name: "Exploration progress" });
  await expect(progress.getByText("Interests")).toHaveAttribute("aria-current", "step");
  await expect(progress.getByRole("link")).toHaveCount(0);
  const hero = page.locator(".hero");
  const panel = page.locator(".explore-panel");
  const initialHero = await hero.boundingBox();
  const initialPanel = await panel.boundingBox();
  expect(initialHero).not.toBeNull();
  expect(initialPanel).not.toBeNull();

  let requests = 0;
  page.on("request", (request) => { if (request.url().endsWith("/api/recommend")) requests++; });
  await textbox(page).fill("robots");
  await page.locator("form").evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(cards(page)).toHaveCount(3);
  expect(requests).toBe(1);
  await expect(progress.getByText("Careers")).toHaveAttribute("aria-current", "step");
  expect((await hero.boundingBox())!.height).toBeLessThan(initialHero!.height);
  expect((await panel.boundingBox())!.width).toBeCloseTo(initialPanel!.width);

  await career(page, robotics).click();
  await expect(page.getByRole("list", { name: "Roadmap steps" })).toBeVisible();
  await expect(progress.getByText("Roadmap")).toHaveAttribute("aria-current", "step");
  expect((await hero.boundingBox())!.height).toBeLessThan(initialHero!.height);
  expect((await panel.boundingBox())!.width).toBeCloseTo(initialPanel!.width);
});

test("E2E-2 accepts chips without text", async ({ page }) => {
  await page.goto("/");
  const chip = page.getByRole("button", { name: "Space", exact: true });
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(textbox(page)).toHaveValue("");
  await page.getByRole("button", { name: "Find careers" }).click();
  await expect(cards(page)).toHaveCount(3);
});

test("E2E-3 shows linked validation errors and does not submit invalid input", async ({ page }) => {
  let requests = 0;
  page.on("request", (request) => { if (request.url().endsWith("/api/recommend")) requests++; });
  await page.goto("/");
  const submit = page.getByRole("button", { name: "Find careers" });
  await submit.click();
  await expect(appAlert(page)).toHaveText("Tell us what you enjoy in a few words, or pick at least one interest below.");
  await expect(textbox(page)).toHaveAttribute("aria-invalid", "true");
  await expect(textbox(page)).toBeFocused();
  await textbox(page).fill("x".repeat(301));
  await submit.click();
  await expect(appAlert(page)).toContainText("300 characters");
  expect(requests).toBe(0);
});

test("E2E-4 preserves the draft and reuses a roadmap in the same exploration", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/roadmap")) requests.push(request.postDataJSON().careerId);
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Space", exact: true }).click();
  await recommend(page);
  await career(page, robotics).click();
  await expect(page.getByRole("list", { name: "Roadmap steps" })).toBeVisible();
  await page.getByRole("button", { name: "Back to careers" }).click();
  await expect(cards(page)).toHaveCount(3);
  // Software Engineer is guaranteed on the three-career seed. On release, use a different returned card.
  if (await career(page, software).count()) await career(page, software).click();
  else await cards(page).filter({ hasNotText: "Robotics Engineer" }).first().getByRole("button").click();
  await expect(page.getByRole("list", { name: "Roadmap steps" })).toBeVisible();
  await page.getByRole("button", { name: "Back to careers" }).click();
  await career(page, robotics).click();
  await expect(page.getByRole("list", { name: "Roadmap steps" })).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[0]).toBe("robotics-engineer");
  expect(requests[1]).not.toBe("robotics-engineer");
  await page.getByRole("button", { name: "Back to careers" }).click();
  await page.getByRole("button", { name: "Edit interests" }).click();
  await expect(textbox(page)).toHaveValue("I like building robots and coding");
  await expect(page.getByRole("button", { name: "Space", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("E2E-5 keeps current recommendations after an earlier response arrives", async ({ page }) => {
  const held = latch();
  const sent = latch();
  const completed = latch();
  await page.route("**/api/recommend", async (route) => {
    if (route.request().postDataJSON().interests !== "robots") return route.continue();
    const response = await route.fetch();
    const body = await response.json();
    body.careers[0].title = "Outdated recommendation";
    sent.release();
    await held.wait;
    await route.fulfill({ response, json: body }).catch(() => {});
    completed.release();
  });
  await page.goto("/");
  await textbox(page).fill("robots");
  await page.getByRole("button", { name: "Find careers" }).click();
  await sent.wait;
  await expect(page.getByRole("status")).toContainText("Finding careers");
  await page.getByRole("button", { name: "Edit interests" }).click();
  await recommend(page, "biology and climate");
  await expect(cards(page).first()).toContainText("Environmental Scientist");
  held.release();
  await completed.wait;
  await expect(cards(page).first()).toContainText("Environmental Scientist");
  await expect(page.getByText("Outdated recommendation")).toHaveCount(0);
});

test("E2E-6 keeps the chosen roadmap when a previous one is slow", async ({ page }) => {
  const held = latch();
  const sent = latch();
  const completed = latch();
  await page.route("**/api/roadmap", async (route) => {
    if (route.request().postDataJSON().careerId !== "robotics-engineer") return route.continue();
    const response = await route.fetch();
    const body = await response.json();
    body.steps[0].title = "Outdated roadmap step";
    sent.release();
    await held.wait;
    await route.fulfill({ response, json: body }).catch(() => {});
    completed.release();
  });
  await page.goto("/");
  await recommend(page);
  await career(page, robotics).click();
  await sent.wait;
  await expect(page.getByRole("status")).toContainText("Loading your roadmap");
  await page.getByRole("button", { name: "Back to careers" }).click();
  const other = cards(page).filter({ hasNotText: "Robotics Engineer" }).first();
  const title = await other.getByRole("heading").innerText();
  await other.getByRole("button").click();
  await expect(page.getByRole("heading", { name: `${title} roadmap` })).toBeVisible();
  await expect(page.getByRole("list", { name: "Roadmap steps" })).toBeVisible();
  held.release();
  await completed.wait;
  await expect(page.getByRole("heading", { name: `${title} roadmap` })).toBeVisible();
  await expect(page.getByText("Outdated roadmap step")).toHaveCount(0);
});

test("E2E-7 shows a friendly server error and retries with the same interests", async ({ page }) => {
  await page.route("**/api/recommend", (route) => route.fulfill({
    status: 500, json: { error: { code: "INTERNAL", message: "internal detail" } },
  }), { times: 1 });
  await page.goto("/");
  await textbox(page).fill("robots");
  await page.getByRole("button", { name: "Find careers" }).click();
  await expect(appAlert(page)).toHaveText("Something went wrong. Please try again.");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(cards(page)).toHaveCount(3);
});

test("E2E-8 announces the Retry-After delay and pauses new requests until it expires", async ({ page }) => {
  await page.route("**/api/recommend", (route) => route.fulfill({
    status: 429, headers: { "retry-after": "3" }, json: { error: { code: "RATE_LIMITED", message: "Wait" } },
  }), { times: 1 });
  await page.goto("/");
  await textbox(page).fill("robots");
  await page.getByRole("button", { name: "Find careers" }).click();
  await expect(appAlert(page)).toContainText("Try again in about 3 seconds");
  await expect(page.getByRole("button", { name: "Try again" })).toBeDisabled();
  await page.getByRole("button", { name: "Edit interests" }).click();
  const submit = page.getByRole("button", { name: "Find careers" });
  await expect(submit).toBeDisabled();
  await expect(page.getByText("Please wait before making another request.")).toBeVisible();
  await expect(submit).toBeEnabled({ timeout: 6000 });
  await submit.click();
  await expect(cards(page)).toHaveCount(3);
});

test("E2E-10 does not persist the exploration across reload", async ({ page, context }) => {
  await page.goto("/");
  await recommend(page);
  await career(page, robotics).click();
  await expect(page.getByRole("list", { name: "Roadmap steps" })).toBeVisible();
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(await context.cookies()).toEqual([]);
  await page.reload();
  await expect(textbox(page)).toHaveValue("");
  await expect(cards(page)).toHaveCount(0);
});

test("moves focus to the next section and supports the full keyboard journey", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(textbox(page)).toBeFocused();
  await page.keyboard.type("robots");
  for (let index = 0; index < 12; index++) await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Find careers" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Your career recommendations" })).toBeFocused();
  await expect(cards(page)).toHaveCount(3);
  await page.keyboard.press("Tab");
  const firstButton = cards(page).first().getByRole("button");
  await expect(firstButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: /roadmap$/i })).toBeFocused();
  await expect(page.getByRole("list", { name: "Roadmap steps" })).toBeVisible();
});
