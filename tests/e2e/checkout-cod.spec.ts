import { expect, test } from "@playwright/test";

test("Bangladesh checkout exposes Cash on Delivery", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Complete your order", level: 1 })).toBeVisible();
  const insideDhaka = page.getByRole("radio", { name: /Inside Dhaka.*BDT 80/i });
  const outsideDhaka = page.getByRole("radio", { name: /Outside Dhaka.*BDT 120/i });
  const cashOnDelivery = page.getByRole("radio", { name: /cash on delivery/i });
  await expect(insideDhaka).toHaveCount(0);
  await expect(outsideDhaka).toHaveCount(0);
  await expect(cashOnDelivery).toBeVisible();
  await expect(cashOnDelivery).not.toBeChecked();

  await cashOnDelivery.check();

  await expect(insideDhaka).toBeVisible();
  await expect(outsideDhaka).toBeVisible();
  await expect(insideDhaka).not.toBeChecked();
  await expect(outsideDhaka).not.toBeChecked();
});
