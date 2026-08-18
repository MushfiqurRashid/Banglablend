import { expect, test } from "@playwright/test";

test("Bangladesh checkout exposes Cash on Delivery", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Complete your order", level: 1 })).toBeVisible();
  const insideDhaka = page.getByRole("radio", { name: /Inside Dhaka.*BDT 80/i });
  const outsideDhaka = page.getByRole("radio", { name: /Outside Dhaka.*BDT 120/i });
  const international = page.getByRole("radio", {
    name: /International.*We will contact shortly/i,
  });
  const cashOnDelivery = page.getByRole("radio", { name: /cash on delivery/i });
  const deliveryMethod = page.getByRole("heading", { name: "Delivery method", level: 3 });
  await expect(deliveryMethod).toHaveCount(0);
  await expect(insideDhaka).toHaveCount(0);
  await expect(outsideDhaka).toHaveCount(0);
  await expect(international).toHaveCount(0);
  await expect(cashOnDelivery).toBeVisible();
  await expect(cashOnDelivery).not.toBeChecked();

  await cashOnDelivery.check();

  await expect(deliveryMethod).toBeVisible();
  await expect(insideDhaka).toBeVisible();
  await expect(outsideDhaka).toBeVisible();
  await expect(international).toBeVisible();
  await expect(insideDhaka).not.toBeChecked();
  await expect(outsideDhaka).not.toBeChecked();
  await expect(international).not.toBeChecked();

  const [insideBox, outsideBox, internationalBox] = await Promise.all([
    insideDhaka.locator("..").boundingBox(),
    outsideDhaka.locator("..").boundingBox(),
    international.locator("..").boundingBox(),
  ]);
  expect(insideBox).not.toBeNull();
  expect(outsideBox).not.toBeNull();
  expect(internationalBox).not.toBeNull();
  expect(internationalBox!.y).toBeGreaterThanOrEqual(
    Math.max(insideBox!.y + insideBox!.height, outsideBox!.y + outsideBox!.height),
  );

  await international.check();
  await expect(international).toBeChecked();
  await expect(page.getByLabel("Country code")).not.toHaveAttribute("readonly");
});
