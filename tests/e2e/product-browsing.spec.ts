import { expect, test } from "@playwright/test";

test("shop and product routes render market-aware details", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.getByRole("heading", { name: "Shop", level: 1 })).toBeVisible();
  await page.goto("/products/mezban-masala");
  await expect(page.getByRole("heading", { name: "Mezban Masala", level: 1 })).toBeVisible();
  await expect(page.getByText(/sample|awaiting|unavailable/i).first()).toBeVisible();
});

test("the shared detail experience renders across the sample catalog", async ({ page }) => {
  const products = [
    ["mezban-masala", "Mezban Masala"],
    ["coxs-bazar-fish-masala", "Cox’s Bazar Fish Masala"],
    ["shorisha-ilish", "Shorisha Ilish"],
    ["hathazari-red-chili", "Hathazari Red Chilli"],
    ["hill-tracts-turmeric", "Hill Tracts Turmeric"],
    ["ginger-paste", "Ginger Paste"],
    ["tea-masala", "Tea Masala"],
    ["taste-of-bangladesh-gift", "Taste of Bangladesh Gift"]
  ] as const;

  for (const [handle, title] of products) {
    await test.step(title, async () => {
      await page.goto(`/products/${handle}`);
      await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Description" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "You may also like", level: 2 })).toBeVisible();
    });
  }
});
