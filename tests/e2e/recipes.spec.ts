import { expect, test, type Locator } from "@playwright/test";

async function expectImageToLoad(image: Locator) {
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element) => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.cookie = "bb_cookie_choice=essential; Path=/; SameSite=Lax";
  });
});

test("recipe library is searchable and opens a complete recipe", async ({ page }) => {
  await page.goto("/recipes");
  await expect(page.getByRole("heading", { level: 1, name: "Recipes rooted in Bangladesh" })).toBeVisible();
  await expect(page.locator(".recipe-premium-card")).toHaveCount(9);
  await expectImageToLoad(page.locator(".recipe-library-hero img"));

  const search = page.getByRole("searchbox", { name: "Search recipes" });
  await search.fill("haor");
  await expect(page.locator(".recipe-premium-card")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Haor-Style Duck Bhuna/ })).toBeVisible();
  await search.fill("");

  await page.getByRole("link", { name: /Rui Shorshe Jhal/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Rui Shorshe Jhal" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Ingredients" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Cook step by step" })).toBeVisible();
  const recipeSchemas = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.filter((script) => {
    try { return JSON.parse(script.textContent ?? "")["@type"] === "Recipe"; } catch { return false; }
  }).length);
  expect(recipeSchemas).toBe(1);
});

test("recipe collections are live and layouts do not overflow", async ({ page }) => {
  for (const [href, heading] of [
    ["/recipes/by-region", "Recipes by region"],
    ["/recipes/by-product", "Cook by product"],
    ["/recipes/traditional", "Traditional recipes"],
    ["/recipes/everyday-cooking", "Everyday cooking"],
  ] as const) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.locator(".recipe-premium-card").first()).toBeVisible();
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});
