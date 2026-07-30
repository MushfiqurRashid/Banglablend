import { expect, test, type Locator, type Page } from "@playwright/test";

async function expectImageToLoad(image: Locator) {
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate(
        (element) =>
          element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0,
      ),
    )
    .toBe(true);
}

async function expectComingSoonPage(page: Page, title: string) {
  await expect(page.getByText("Coming soon", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
  await expect(page.getByText("শীঘ্রই আসছে", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore the shop", exact: true })).toHaveAttribute(
    "href",
    "/shop",
  );
  await expectImageToLoad(page.locator("main img").first());
}

test("recipe library and its browse views present the premium coming-soon experience", async ({
  page,
}) => {
  await page.addInitScript(() => {
    document.cookie = "bb_cookie_choice=essential; Path=/; SameSite=Lax";
  });

  const recipePages = [
    ["/recipes", "Recipe Library"],
    ["/recipes/by-region", "Recipes by Region"],
    ["/recipes/by-product", "Recipes by Product"],
    ["/recipes/traditional", "Traditional Recipes"],
    ["/recipes/everyday-cooking", "Everyday Cooking"],
  ] as const;

  for (const [href, title] of recipePages) {
    await page.goto(href);
    await expectComingSoonPage(page, title);
  }

  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);

  await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});
