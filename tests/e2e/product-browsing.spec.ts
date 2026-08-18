import { expect, test } from "@playwright/test";

const approvedProducts = [
  ["mezban-masala", "Mezban Masala"],
  ["black-pepper", "Black Pepper"],
  ["white-pepper-powder", "White Pepper Powder"],
  ["coxs-bazar-fish-masala", "Cox’s Bazar Fish Masala"],
  ["hathazari-red-chili", "Hathazari Red Chilli Powder"],
  ["shahi-garam-masala", "Shahi Garam Masala"],
] as const;

const approvedBangladeshPrices = [
  ["mezban-masala", [["75 g", 200], ["100 g", 220]]],
  ["black-pepper", [["75 g", 250]]],
  ["white-pepper-powder", [["75 g", 270]]],
  ["coxs-bazar-fish-masala", [["75 g", 200], ["100 g", 220]]],
  ["hathazari-red-chili", [["100 g", 200], ["125 g", 220]]],
  ["shahi-garam-masala", [["75 g", 250], ["100 g", 300]]],
] as const;

test("shop and product routes render market-aware details", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.getByRole("heading", { name: "Shop", level: 1 })).toBeVisible();
  await page.goto("/products/mezban-masala");
  await expect(page.getByRole("heading", { name: "Mezban Masala", level: 1 })).toBeVisible();
  await expect(page.locator(".pdp-subtitle")).toHaveText(
    "Authentic Chattogram spice blend for rich traditional dishes",
  );
});

test("shop subsections reuse the catalog UI and scope the visible products", async ({ page }) => {
  await page.goto("/shop/originals");

  await expect(page.locator(".shop-landing")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Originals", level: 1 })).toBeVisible();
  await expect(page.locator(".shop-category-shortcut")).toHaveCount(8);
  await expect(page.getByRole("link", { name: "Build a Box" })).toHaveCount(0);
  await expect(
    page.locator('.shop-category-shortcut[aria-current="page"]'),
  ).toContainText("Originals");
  await expect(page.locator(".shop-product-card")).toHaveCount(3);

  const originalCategoryFilters = page
    .locator(".shop-filter-group")
    .filter({ has: page.locator("summary", { hasText: "Category" }) })
    .locator("label");
  await expect(originalCategoryFilters).toHaveCount(1);
  await expect(originalCategoryFilters).toContainText(["Originals"]);

  await page.goto("/shop/reserve");
  await expect(page.getByRole("heading", { name: "Reserve", level: 1 })).toBeVisible();
  await expect(
    page.locator('.shop-category-shortcut[aria-current="page"]'),
  ).toContainText("Reserve");
  await expect(page.locator(".shop-product-card")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Mezban Masala", level: 2 })).toHaveCount(0);
});

test("the shared detail experience renders across the six approved products", async ({ page }) => {
  for (const [handle, title] of approvedProducts) {
    await test.step(title, async () => {
      await page.goto(`/products/${handle}`);
      await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Description" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "You may also like", level: 2 })).toBeVisible();
      const whyBanglaBlend = page.getByTestId("why-bangla-blend");
      await expect(
        whyBanglaBlend.getByRole("heading", {
          name: "Why Bangla Blend",
          level: 2,
          exact: true,
        }),
      ).toBeVisible();
      await expect(whyBanglaBlend.getByRole("row")).toHaveCount(5);
    });
  }
});

test("All Spices contains only the six approved products", async ({ page }) => {
  await page.goto("/shop/all");

  const cards = page.locator(".shop-product-card");
  await expect(cards).toHaveCount(6);
  const visibleTitles = await cards.locator("h2").allTextContents();
  expect(visibleTitles.sort()).toEqual(approvedProducts.map(([, title]) => title).sort());
});

test("the six products use the approved Bangladesh size and MRP list", async ({ page }) => {
  await page.goto("/shop/all");
  for (const [handle, variants] of approvedBangladeshPrices) {
    const title = approvedProducts.find(([productHandle]) => productHandle === handle)?.[1];
    const card = page.locator(".shop-product-card").filter({
      has: page.getByRole("heading", { name: title, level: 2 }),
    });
    await expect(card.locator(".shop-product-meta strong")).toContainText(
      `BDT ${variants[0][1]}`,
    );
  }

  for (const [handle, variants] of approvedBangladeshPrices) {
    await test.step(handle, async () => {
      await page.goto(`/products/${handle}`);

      const options = page.locator(".variant-option");
      await expect(options).toHaveCount(variants.length);

      for (const [index, [size, price]] of variants.entries()) {
        await expect(options.nth(index)).toContainText(size);
        await expect(options.nth(index)).toContainText(`BDT ${price}`);
      }
    });
  }
});
