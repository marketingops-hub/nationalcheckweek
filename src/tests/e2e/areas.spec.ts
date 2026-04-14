import { test, expect } from "@playwright/test";

const KNOWN_AREA_SLUGS = [
  "sydney",
  "newcastle",
  "melbourne",
  "brisbane",
];

test.describe("Area pages", () => {
  test("/areas/sydney — page loads with school stats", async ({ page }) => {
    await page.goto("/areas/sydney");
    await expect(page.locator("h1")).toBeVisible();
    // School stats panel must render (not blank/error)
    const statsPanel = page.locator("[data-testid='school-stats'], section").filter({ hasText: /school/i });
    await expect(statsPanel.first()).toBeVisible();
    // Must not show an error state
    await expect(page.locator("text=Something went wrong")).not.toBeVisible();
    await expect(page.locator("text=Error")).not.toBeVisible();
  });

  test("/areas/sydney — issue cards link to /issues/ pages", async ({ page }) => {
    await page.goto("/areas/sydney");
    const issueLinks = page.locator("a[href*='/issues/']");
    const count = await issueLinks.count();
    expect(count, "Sydney area page should link to at least one issue").toBeGreaterThanOrEqual(1);
    // Spot-check first link resolves
    const href = await issueLinks.first().getAttribute("href");
    expect(href).toMatch(/^\/issues\//);
  });

  for (const slug of KNOWN_AREA_SLUGS) {
    test(`/areas/${slug} — returns 200`, async ({ page }) => {
      const response = await page.goto(`/areas/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    });
  }
});
