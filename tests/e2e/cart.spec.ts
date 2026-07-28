import { expect, test } from "@playwright/test";

test("cart is reachable and starts in a safe empty state", async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Shopping bag", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your shopping bag is empty" })).toBeVisible();
});
