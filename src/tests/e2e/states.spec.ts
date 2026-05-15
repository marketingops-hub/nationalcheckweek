import { test, expect } from "@playwright/test";

const STATES = [
  { slug: "victoria",                       minSchools: 1500 },
  { slug: "new-south-wales",                minSchools: 2000 },
  { slug: "queensland",                     minSchools: 1200 },
  { slug: "western-australia",              minSchools: 800  },
  { slug: "south-australia",                minSchools: 500  },
  { slug: "tasmania",                       minSchools: 200  },
  { slug: "australian-capital-territory",   minSchools: 80   },
  { slug: "northern-territory",             minSchools: 100  },
];

test.describe("State pages", () => {
  test("states index page loads", async ({ page }) => {
    await page.goto("/states");
    await expect(page).toHaveTitle(/state/i);
    const cards = page.locator("a[href*='/states/']");
    await expect(cards).toHaveCount(8);
  });

  for (const { slug, minSchools } of STATES) {
    test(`/states/${slug} — page loads and school stats are non-zero`, async ({ page }) => {
      await page.goto(`/states/${slug}`);

      // Page title present
      await expect(page.locator("h1")).toBeVisible();

      // School stats panel: total schools must be >= minSchools
      // The panel renders a number like "1,586" or "2,310"
      const statsText = await page.locator("section").filter({ hasText: /school/i }).textContent();
      expect(statsText).toBeTruthy();

      // Extract the first large number from the stats panel
      const matches = (statsText ?? "").match(/[\d,]+/g) ?? [];
      const totals = matches.map(m => parseInt(m.replace(/,/g, ""), 10)).filter(n => n > 10);
      const maxFound = Math.max(...totals, 0);

      expect(maxFound).toBeGreaterThanOrEqual(minSchools);
    });
  }

  test("/states/western-australia — issue cards link to /issues/ pages", async ({ page }) => {
    await page.goto("/states/western-australia");

    // Find issue cards that are links
    const linkedIssues = page.locator("a[href*='/issues/']");
    const count = await linkedIssues.count();
    expect(count).toBeGreaterThan(0);

    // Click the first one and verify it goes to an issue page
    const firstHref = await linkedIssues.first().getAttribute("href");
    expect(firstHref).toMatch(/^\/issues\//);

    await linkedIssues.first().click();
    await expect(page).toHaveURL(/\/issues\//);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("/states/victoria — issue cards link to /issues/ pages", async ({ page }) => {
    await page.goto("/states/victoria");
    const linkedIssues = page.locator("a[href*='/issues/']");
    await expect(linkedIssues.first()).toBeVisible();
    const count = await linkedIssues.count();
    expect(count).toBeGreaterThan(0);
  });
});
