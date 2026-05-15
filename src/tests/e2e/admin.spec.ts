import { test, expect, type Page } from "@playwright/test";

/**
 * Admin flow tests.
 * Requires PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD env vars.
 * Skipped if credentials are not set.
 */

const adminEmail    = process.env.PLAYWRIGHT_ADMIN_EMAIL    ?? "";
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "";
const hasCredentials = !!adminEmail && !!adminPassword;

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.fill("input[type='email']", adminEmail);
  await page.fill("input[type='password']", adminPassword);
  await page.click("button[type='submit']");
  await page.waitForURL(/\/admin(?!\/login)/);
}

const ADMIN_PAGES = [
  "/admin",
  "/admin/states",
  "/admin/issues",
  "/admin/schools",
  "/admin/users",
  "/admin/sources",
  "/admin/partners",
  "/admin/events",
  "/admin/blog",
  "/admin/pages",
  "/admin/cms/pages",
  "/admin/cms/redirects",
  "/admin/settings",
  "/admin/seo",
];

const ERROR_SELECTORS = [
  "text=Unauthorized",
  "text=Something went wrong",
  "text=Application error",
  "text=500",
  "text=Internal Server Error",
];

test.describe("Admin — login", () => {
  test("login page loads", async ({ page }) => {
    const res = await page.goto("/admin/login");
    expect(res?.status()).toBe(200);
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("login with valid credentials reaches dashboard", async ({ page }) => {
    test.skip(!hasCredentials, "PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD not set");
    await loginAsAdmin(page);
    await page.waitForURL(/\/admin/);
    expect(page.url()).not.toMatch(/\/admin\/login/);
  });
});

test.describe("Admin — states CRUD", () => {
  test("states list page loads and shows 8 states", async ({ page }) => {
    test.skip(!hasCredentials, "PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD not set");
    await loginAsAdmin(page);
    await page.goto("/admin/states");
    await expect(page.locator("h1")).toBeVisible();
    const rows = page.locator("tr, [data-testid='state-row'], a[href*='/admin/states/']");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  test("victoria edit page loads with save button", async ({ page }) => {
    test.skip(!hasCredentials, "PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD not set");
    await loginAsAdmin(page);
    await page.goto("/admin/states/victoria");
    await expect(page.locator("h1, h2")).toBeVisible();
    await expect(page.locator("button[type='submit'], button:has-text('Save')")).toBeVisible();
  });
});

test.describe("Admin — issues CRUD", () => {
  test("issues list page loads and shows at least 10 issues", async ({ page }) => {
    test.skip(!hasCredentials, "PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD not set");
    await loginAsAdmin(page);
    await page.goto("/admin/issues");
    await expect(page.locator("h1")).toBeVisible();
    const rows = page.locator("tr, a[href*='/admin/issues/']");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test("schools admin page shows correct total count > 10,000", async ({ page }) => {
    test.skip(!hasCredentials, "PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD not set");
    await loginAsAdmin(page);
    await page.goto("/admin/schools");
    const subtitle = await page.locator(".swa-page-subtitle").textContent();
    const match = (subtitle ?? "").match(/[\d,]+/);
    const total = parseInt((match?.[0] ?? "0").replace(/,/g, ""), 10);
    expect(total).toBeGreaterThan(10000);
  });
});

test.describe("Admin — page sweep (no crashes)", () => {
  for (const path of ADMIN_PAGES) {
    test(`${path} — loads without error`, async ({ page }) => {
      test.skip(!hasCredentials, "PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD not set");
      await loginAsAdmin(page);
      const res = await page.goto(path);
      // Must not redirect back to login (means auth failed)
      expect(page.url()).not.toMatch(/\/admin\/login/);
      // Must return a successful HTTP status
      expect(res?.status()).toBeLessThan(500);
      // Must not show any error message on the page
      for (const selector of ERROR_SELECTORS) {
        await expect(page.locator(selector).first()).not.toBeVisible();
      }
    });
  }
});

test.describe("Admin — user management", () => {
  test("/admin/users — page loads and shows New User button", async ({ page }) => {
    test.skip(!hasCredentials, "PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD not set");
    await loginAsAdmin(page);
    await page.goto("/admin/users");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("button:has-text('New User')")).toBeVisible();
  });

  test("/admin/users — create user API returns 200 (not 401)", async ({ page }) => {
    test.skip(!hasCredentials, "PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD not set");
    await loginAsAdmin(page);
    // Hit the API directly from the browser context (cookies are set)
    const res = await page.request.post("/api/admin/users", {
      data: { email: `pw-test-${Date.now()}@example.com`, password: "TestPass123!" },
    });
    // 200 = created, 400 = validation error — both are fine. 401 = auth broken.
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
  });
});
