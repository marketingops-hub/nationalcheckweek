import { test, expect } from "@playwright/test";

const KNOWN_ISSUE_SLUGS = [
  "anxiety-depression",
  "bullying",
  "cyberbullying",
  "self-harm-suicidality",
  "school-refusal",
  "attendance-disengagement",
  "distress-loneliness",
  "school-belonging",
  "racism-discrimination",
  "sleep-deprivation",
  "motivation-disengagement",
  "online-hate",
];

test.describe("Issues pages", () => {
  test("/issues — listing page shows all 15 issues", async ({ page }) => {
    await page.goto("/issues");
    await expect(page.locator("h1")).toBeVisible();

    // Issue cards should be present
    const cards = page.locator("a[href*='/issues/']");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(15);
  });

  for (const slug of KNOWN_ISSUE_SLUGS) {
    test(`/issues/${slug} — page loads with title and content`, async ({ page }) => {
      const response = await page.goto(`/issues/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    });
  }
});
