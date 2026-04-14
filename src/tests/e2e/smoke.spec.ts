import { test, expect } from "@playwright/test";

test.describe("Smoke tests — critical public pages", () => {
  test("homepage loads", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("/issues listing page loads", async ({ page }) => {
    const res = await page.goto("/issues");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("/states listing page loads", async ({ page }) => {
    const res = await page.goto("/states");
    expect(res?.status()).toBe(200);
  });

  test("404 page does not throw a 500", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-at-all");
    // Should return 404, not 500
    expect(res?.status()).not.toBe(500);
  });

  test("navigation links are present on homepage", async ({ page }) => {
    await page.goto("/");
    // Check key nav links exist
    await expect(page.locator("a[href='/states']")).toBeVisible();
    await expect(page.locator("a[href='/issues']")).toBeVisible();
  });
});
