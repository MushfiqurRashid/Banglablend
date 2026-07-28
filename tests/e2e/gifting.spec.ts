import { expect, test } from "@playwright/test";

test("gift journey includes personal and corporate paths", async ({ page }) => {
  await page.goto("/gifts");
  await expect(page.getByRole("heading", { name: "Give the Taste of Bangladesh", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /corporate/i }).first()).toBeVisible();
});
