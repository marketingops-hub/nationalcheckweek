import { test, expect } from "@playwright/test";

const BASE_URL = process.env.ENVIRONMENT_URL ?? "https://nationalcheckinweek.com";

test("homepage loads and has navigation", async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("a[href='/states']")).toBeVisible();
  await expect(page.locator("a[href='/issues']")).toBeVisible();
});

test("Victoria school stats are non-zero", async ({ page }) => {
  await page.goto(`${BASE_URL}/states/victoria`);
  await expect(page.locator("h1")).toBeVisible();

  // School stats section must show a number >= 1500
  const statsText = await page
    .locator("section")
    .filter({ hasText: /school/i })
    .first()
    .textContent({ timeout: 15000 });

  const numbers = (statsText ?? "")
    .match(/[\d,]+/g)
    ?.map((n) => parseInt(n.replace(/,/g, ""), 10))
    .filter((n) => n > 10) ?? [];

  const max = Math.max(...numbers, 0);
  expect(max, `Victoria school count too low (${max}) — PostgREST cap may have re-appeared`).toBeGreaterThanOrEqual(1500);
});

test("Issues listing shows at least 10 issues", async ({ page }) => {
  await page.goto(`${BASE_URL}/issues`);
  await expect(page.locator("h1")).toBeVisible();
  const links = page.locator("a[href*='/issues/']");
  await expect(links.first()).toBeVisible();
  const count = await links.count();
  expect(count).toBeGreaterThanOrEqual(10);
});

test("Issue link from state page resolves", async ({ page }) => {
  await page.goto(`${BASE_URL}/states/victoria`);
  const issueLink = page.locator("a[href*='/issues/']").first();
  await expect(issueLink).toBeVisible();
  await issueLink.click();
  await expect(page).toHaveURL(/\/issues\//);
  await expect(page.locator("h1")).toBeVisible();
});
