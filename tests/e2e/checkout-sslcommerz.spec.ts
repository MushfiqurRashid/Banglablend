import { expect, test } from "@playwright/test";

test("Bangladesh checkout offers server-mediated SSLCOMMERZ", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByText(/sslcommerz/i).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/store[_ -]?password/i);
});
