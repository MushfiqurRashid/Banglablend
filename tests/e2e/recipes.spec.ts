import { expect, test, type Locator } from "@playwright/test";

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

async function expectLinkToReceiveClick(link: Locator) {
  await link.scrollIntoViewIfNeeded();
  await link.evaluate((element) => {
    element.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        element.setAttribute("data-click-received", "true");
      },
      { once: true },
    );
  });
  await link.click();
  await expect(link).toHaveAttribute("data-click-received", "true");
}

test("recipes landing page presents browsable recipes and working calls to action", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");

  const essentialOnly = page.getByRole("button", { name: "Essential only" });
  await essentialOnly.waitFor({ state: "visible", timeout: 2_500 }).catch(() => undefined);
  if (await essentialOnly.isVisible()) await essentialOnly.click();

  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Main navigation" });
    await menu.getByText("Recipes", { exact: true }).click();
    await menu.getByRole("link", { name: "View all Recipes" }).click();
  } else {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Recipes", exact: true })
      .click();
  }

  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByRole("heading", { level: 1, name: "Recipes", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();

  const explore = page.getByRole("link", { name: "Explore recipes", exact: true });
  await expect(explore).toHaveAttribute("href", "#featured-recipes");
  await explore.click();
  await expect(page).toHaveURL(/\/recipes#featured-recipes$/);
  await expect(page.locator("#featured-recipes")).toBeInViewport();

  const categoryLinks = [
    ["By Region", "/recipes/by-region"],
    ["By Product", "/recipes/by-product"],
    ["Traditional", "/recipes/traditional"],
    ["Everyday Cooking", "/recipes/everyday-cooking"],
    ["All Recipes", "/recipes#featured-recipes"],
  ] as const;
  const categories = page.getByRole("navigation", { name: "Browse recipes by" });

  await expect(categories.getByRole("link")).toHaveCount(categoryLinks.length);
  for (const [label, href] of categoryLinks) {
    const link = categories.getByRole("link", { name: label, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await expectLinkToReceiveClick(link);
  }

  const recipeImages = page.locator(".recipes-page img");
  expect(await recipeImages.count()).toBeGreaterThanOrEqual(12);
  for (let index = 0; index < (await recipeImages.count()); index += 1) {
    await expectImageToLoad(recipeImages.nth(index));
  }

  const featuredCards = page.locator(".recipes-feature-card");
  await expect(featuredCards).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    await expectLinkToReceiveClick(featuredCards.nth(index).getByRole("link"));
  }

  await expect(page.getByRole("link", { name: "View all recipes", exact: true })).toHaveAttribute(
    "href",
    "/recipes#featured-recipes",
  );

  const shopSpices = page.getByRole("link", { name: "Shop spices", exact: true });
  await expect(shopSpices).toHaveAttribute("href", "/shop");
  await expectLinkToReceiveClick(shopSpices);

  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);

  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Flavors and stories from Bangladesh",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();

  await categories.getByRole("link", { name: "By Region", exact: true }).click();
  await expect(page).toHaveURL(/\/recipes\/by-region$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Recipes by region", exact: true }),
  ).toBeVisible();
});
