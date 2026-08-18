import { expect, test } from "@playwright/test";

const desktopPages = [
  { path: "/shop/all", hero: ".shop-landing-hero", maxHeight: 430 },
  { path: "/gifts", hero: ".page-hero", maxHeight: 470 },
  { path: "/recipes", hero: "main > section:first-child", maxHeight: 710 },
  { path: "/discover-bangladesh", hero: ".discover-hero", maxHeight: 330 },
  { path: "/our-story", hero: ".story-hero", maxHeight: 460 },
  { path: "/about-bangla-blend", hero: ".about-brand-hero", maxHeight: 570 },
  { path: "/contact", hero: ".contact-hero", maxHeight: 470 },
  { path: "/faq", hero: ".faq-hero", maxHeight: 300 },
  { path: "/cart", hero: ".cart-hero", maxHeight: 390 },
  { path: "/checkout", hero: ".checkout-hero", maxHeight: 440 },
];

test.describe("compact page density", () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "bb_cookie_choice",
        value: "essential",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  for (const pageCase of desktopPages) {
    test(`${pageCase.path} keeps its opening section compact`, async ({ page }) => {
      await page.goto(pageCase.path);

      const hero = page.locator(pageCase.hero).first();
      await expect(hero).toBeVisible();
      await expect(hero).toHaveCSS("overflow-x", /^(visible|hidden|clip|auto)$/);

      const heroBox = await hero.boundingBox();
      expect(heroBox?.height).toBeLessThanOrEqual(pageCase.maxHeight);

      const titleSize = await page
        .locator("main h1")
        .first()
        .evaluate((title) => Number.parseFloat(getComputedStyle(title).fontSize));
      expect(titleSize).toBeLessThanOrEqual(84);
    });
  }

  test("shared content sections use compact vertical padding", async ({ page }) => {
    await page.goto("/shop/all");

    const catalogPadding = await page.locator(".shop-catalog-section").evaluate((section) => {
      const styles = getComputedStyle(section);
      return {
        top: Number.parseFloat(styles.paddingTop),
        bottom: Number.parseFloat(styles.paddingBottom),
      };
    });

    expect(catalogPadding.top).toBeLessThanOrEqual(52);
    expect(catalogPadding.bottom).toBeLessThanOrEqual(52);
  });
});
