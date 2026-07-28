import { expect, test } from "@playwright/test";

test("Bangladesh checkout exposes Cash on Delivery", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Delivery and payment", level: 1 })).toBeVisible();
  await expect(page.getByRole("radio", { name: /cash on delivery/i })).toBeVisible();
});
