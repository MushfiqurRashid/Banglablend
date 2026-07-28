import { expect, test } from "@playwright/test";

test("search supports a transliterated query", async ({ page }) => {
  await page.goto("/search?q=mezban");
  await expect(page.getByRole("heading", { name: "Search Bangla Blend", level: 1 })).toBeVisible();
  await expect(page.getByRole("searchbox")).toHaveValue("mezban");
});
