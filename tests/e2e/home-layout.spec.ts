import { expect, test } from "@playwright/test";

test("home page serves the premium campaign hero and reference copy", async ({ page, request }) => {
  await page.goto("/");

  const hero = page.locator(".home-hero");
  await expect(
    hero.getByText("Regional spice blends · Crafted in Bangladesh", { exact: true }),
  ).toBeVisible();
  await expect(
    hero.getByRole("heading", {
      level: 1,
      name: "Bring home the taste of Bangladesh",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    hero.getByText(
      "Small-batch spice blends inspired by regional cooking, made with carefully sourced ingredients and no unnecessary additives.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(hero.getByRole("link", { name: /shop the collection/i })).toHaveAttribute(
    "href",
    "/shop",
  );
  await expect(hero.getByRole("link", { name: /explore recipes/i })).toHaveAttribute(
    "href",
    "/recipes",
  );
  const headlineColor = await hero.getByRole("heading", { level: 1 }).evaluate((heading) => {
    const probe = document.createElement("span");
    probe.style.color = "var(--color-deep-chilli)";
    document.body.append(probe);
    const result = {
      actual: getComputedStyle(heading).color,
      expected: getComputedStyle(probe).color,
    };
    probe.remove();
    return result;
  });
  expect(headlineColor.actual).toBe(headlineColor.expected);

  const promises = page.locator(".promise-item");
  await expect(promises).toHaveCount(4);
  await expect(promises.nth(0)).toContainText("Rooted in heritage");
  await expect(promises.nth(1)).toContainText("Authenticity first");
  await expect(promises.nth(2)).toContainText("Crafted with care");
  await expect(promises.nth(3)).toContainText("People first");

  const heroImage = hero.locator(".home-hero-media img");
  await expect(heroImage).toHaveAttribute("src", /home-hero-premium-v2\.webp/);
  await expect
    .poll(() => heroImage.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  const asset = await request.get("/images/home-hero-premium-v2.webp");
  expect(asset.status()).toBe(200);
  expect((await asset.body()).byteLength).toBeGreaterThan(200_000);

  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("desktop home hero and its calls to action fit in the initial viewport", async ({ page }) => {
  const viewports = [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const metrics = await page.locator(".home-hero").evaluate((hero) => {
      const heroBox = hero.getBoundingClientRect();
      const copyBox = hero.querySelector<HTMLElement>(".home-hero-copy")!.getBoundingClientRect();
      const actionsBox = hero.querySelector<HTMLElement>(".hero-actions")!.getBoundingClientRect();

      return {
        heroBottom: heroBox.bottom,
        copyTopGap: copyBox.top - heroBox.top,
        actionsBottom: actionsBox.bottom,
      };
    });

    expect(metrics.heroBottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(metrics.actionsBottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(metrics.copyTopGap).toBeLessThanOrEqual(65);
  }
});

test("shared page heroes avoid an oversized gap below the site header", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/search", { waitUntil: "domcontentloaded" });

  const topPadding = await page
    .locator(".page-hero")
    .evaluate((hero) => Number.parseFloat(getComputedStyle(hero).paddingTop));

  expect(topPadding).toBeLessThanOrEqual(60);
});

test("home page keeps the promise band and section rhythm compact", async ({ page, isMobile }) => {
  await page.goto("/");

  const promiseItems = page.locator(".promise-item");
  await expect(promiseItems).toHaveCount(4);
  const firstPromiseBox = await promiseItems.first().boundingBox();
  expect(firstPromiseBox).not.toBeNull();
  expect(firstPromiseBox!.height).toBeLessThanOrEqual(isMobile ? 110 : 96);

  const categoryCards = page.locator(".home-category-card");
  const expectedCategories = [
    ["New Arrivals", "/shop/new-arrivals"],
    ["Originals", "/shop/originals"],
    ["Reserve", "/shop/reserve"],
    ["Best Sellers", "/shop/best-sellers"],
  ] as const;
  await expect(categoryCards).toHaveCount(expectedCategories.length);
  for (const [index, [label, href]] of expectedCategories.entries()) {
    await expect(categoryCards.nth(index)).toContainText(label);
    await expect(categoryCards.nth(index)).toHaveAttribute("href", href);
  }

  const communityRecipes = page.locator(".recipe-feature-section");
  await expect(
    communityRecipes.getByRole("heading", {
      level: 2,
      name: "Recipes Our Community Loves",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    communityRecipes.getByText("The recipes everyone keeps coming back for!", { exact: true }),
  ).toBeVisible();
  await expect(communityRecipes.locator(".home-recipe-feature")).toHaveCount(1);
  await expect(communityRecipes.locator(".community-recipe-card")).toHaveCount(4);

  const whyBanglaBlend = page.getByTestId("why-bangla-blend");
  await expect(
    whyBanglaBlend.getByRole("heading", { level: 2, name: "Why Bangla Blend", exact: true }),
  ).toBeVisible();
  await expect(whyBanglaBlend.getByRole("row")).toHaveCount(5);
  const whySectionPadding = await whyBanglaBlend.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).paddingTop),
  );
  expect(whySectionPadding).toBeLessThanOrEqual(72);

  for (const selector of [
    ".category-section",
    ".most-popular-section",
    ".impact-section",
    ".market-section",
    ".recipe-feature-section",
  ]) {
    const sectionPadding = await page.locator(selector).evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingTop),
    );
    expect(sectionPadding).toBeLessThanOrEqual(72);
  }

  const firstStoryLink = await page.locator(".feature-link").first().boundingBox();
  expect(firstStoryLink).not.toBeNull();
  expect(firstStoryLink!.height).toBeLessThanOrEqual(isMobile ? 64 : 72);
  const firstStoryFontSize = await page.locator(".feature-name").first().evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(firstStoryFontSize).toBeGreaterThanOrEqual(isMobile ? 13 : 14);

  const storyCopyPadding = await page.locator(".region-feature-copy").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).paddingTop),
  );
  expect(storyCopyPadding).toBeLessThanOrEqual(isMobile ? 40 : 68);

  const storySectionBox = await page.locator(".region-feature").boundingBox();
  const storyGridBox = await page.locator(".region-feature-grid").boundingBox();
  const storyMediaBox = await page.locator(".region-feature-media").boundingBox();
  const storyCopyBox = await page.locator(".region-feature-copy").boundingBox();
  expect(storySectionBox).not.toBeNull();
  expect(storyGridBox).not.toBeNull();
  expect(storyMediaBox).not.toBeNull();
  expect(storyCopyBox).not.toBeNull();
  expect(Math.abs(storyGridBox!.x - storySectionBox!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(storyGridBox!.y - storySectionBox!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(storyGridBox!.width - storySectionBox!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(storyMediaBox!.x - storyGridBox!.x)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(storyCopyBox!.x + storyCopyBox!.width - (storyGridBox!.x + storyGridBox!.width)),
  ).toBeLessThanOrEqual(1);

  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("Most Popular uses the same products as the Best Sellers collection", async ({ page }) => {
  await page.goto("/");

  const popularSection = page.locator(".most-popular-section");
  await expect(
    popularSection.getByRole("heading", { level: 2, name: "Most Popular", exact: true }),
  ).toBeVisible();
  await expect(
    popularSection.getByRole("link", { name: /view all popular/i }),
  ).toHaveAttribute("href", "/shop/best-sellers");

  const popularTitles = await popularSection.locator(".product-card h3").allTextContents();
  expect(popularTitles).toHaveLength(4);
  const popularCards = popularSection.locator(".product-card");
  await expect(popularCards.getByRole("link", { name: "Click to order" })).toHaveCount(4);
  await expect(popularSection.locator(".add-to-cart")).toHaveCount(0);

  for (let index = 0; index < (await popularCards.count()); index += 1) {
    const card = popularCards.nth(index);
    const productHref = await card.locator(".product-card-image").getAttribute("href");
    await expect(card.getByRole("link", { name: "Click to order" })).toHaveAttribute(
      "href",
      productHref!,
    );
  }

  const firstOrderLink = popularCards.first().getByRole("link", { name: "Click to order" });
  const firstProductHref = await firstOrderLink.getAttribute("href");
  await firstOrderLink.click();
  await expect(page).toHaveURL(new RegExp(`${firstProductHref!.replaceAll("/", "\\/")}$`));

  await page.goto("/shop/best-sellers");
  const bestSellerTitles = await page.locator(".shop-product-card h2").allTextContents();
  for (const title of popularTitles) {
    expect(bestSellerTitles).toContain(title);
  }
});
