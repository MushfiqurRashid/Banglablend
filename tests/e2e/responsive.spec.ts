import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const routes = [
  "/",
  "/shop",
  "/products/mezban-masala",
  "/discover-bangladesh",
  "/our-story",
  "/contact",
  "/account/login",
  "/recipes",
] as const;

const viewports = [
  { name: "small-phone-portrait", width: 320, height: 568 },
  { name: "phone-portrait", width: 390, height: 844 },
  { name: "phone-landscape", width: 844, height: 390 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "tablet-landscape", width: 1024, height: 768 },
] as const;

async function acceptEssentialCookies(page: Page) {
  await page.context().addCookies([
    {
      name: "bb_cookie_choice",
      value: "essential",
      url: "http://localhost:3000",
    },
  ]);
}

for (const viewport of viewports) {
  test(`${viewport.name} keeps representative pages inside the viewport`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    await acceptEssentialCookies(page);

    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(650);

      const layout = await page.evaluate(() => {
        const root = document.documentElement;
        const main = document.querySelector<HTMLElement>("#main-content");
        const mainRect = main?.getBoundingClientRect();

        return {
          overflow: Math.max(root.scrollWidth, document.body.scrollWidth) - window.innerWidth,
          mainLeft: mainRect?.left ?? 0,
          mainRight: mainRect?.right ?? window.innerWidth,
        };
      });

      expect(layout.overflow, `${route} has horizontal page overflow`).toBeLessThanOrEqual(1);
      expect(layout.mainLeft, `${route} starts outside the viewport`).toBeGreaterThanOrEqual(-1);
      expect(layout.mainRight, `${route} extends outside the viewport`).toBeLessThanOrEqual(
        viewport.width + 1,
      );

      if (route === "/" && viewport.width <= 400) {
        const heroTitle = await page.locator(".home-hero h1").boundingBox();
        expect(heroTitle).not.toBeNull();
        expect(heroTitle!.x).toBeGreaterThanOrEqual(-1);
        expect(heroTitle!.x + heroTitle!.width).toBeLessThanOrEqual(viewport.width + 1);
      }

      if (route === "/discover-bangladesh" && viewport.width <= 600) {
        const heroMedia = await page.locator(".discover-hero-media").boundingBox();
        expect(heroMedia).not.toBeNull();
        expect(heroMedia!.x).toBeGreaterThanOrEqual(-1);
        expect(heroMedia!.x + heroMedia!.width).toBeLessThanOrEqual(viewport.width + 1);
      }
    }
  });
}

test("mobile header keeps the brand and controls separated at every compact size", async ({ page }) => {
  await acceptEssentialCookies(page);

  for (const viewport of viewports.filter(({ width }) => width <= 900)) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(650);

    const header = page.locator(".header-main");
    const menuButton = page.getByRole("button", { name: "Open menu" });
    const brand = header.getByRole("link", { name: "Bangla Blend home" });
    const wordmark = brand.locator(".brand-wordmark");
    const actions = header.locator(".header-actions");

    await expect(menuButton).toBeVisible();
    await expect(wordmark).toBeVisible();
    await expect(wordmark).toHaveText("Bangla Blend");

    const [menuBox, brandBox, actionsBox] = await Promise.all([
      menuButton.boundingBox(),
      brand.boundingBox(),
      actions.boundingBox(),
    ]);

    expect(menuBox).not.toBeNull();
    expect(brandBox).not.toBeNull();
    expect(actionsBox).not.toBeNull();
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(brandBox!.x + 1);
    expect(brandBox!.x + brandBox!.width).toBeLessThanOrEqual(actionsBox!.x + 1);
    expect(actionsBox!.x + actionsBox!.width).toBeLessThanOrEqual(viewport.width + 1);
  }
});

test("mobile navigation fills the usable viewport and remains scrollable", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await acceptEssentialCookies(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open menu" }).click();

  const menu = page.getByRole("dialog", { name: "Main navigation" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: "Bangla Blend home" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Search" })).toBeVisible();
  await expect(menu.getByRole("combobox", { name: /delivery destination/i })).toBeVisible();

  const box = await menu.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeCloseTo(0, 0);
  expect(box!.y).toBeCloseTo(0, 0);
  expect(box!.width).toBeCloseTo(844, 0);
  expect(box!.height).toBeCloseTo(390, 0);
});

test("footer stays compact and uses a clear responsive column grid", async ({ page }) => {
  await acceptEssentialCookies(page);

  const footerLayouts = [
    { width: 1440, height: 900, columns: 6, maxFooterHeight: 450 },
    { width: 768, height: 1024, columns: 3, maxFooterHeight: 800 },
    { width: 844, height: 390, columns: 3, maxFooterHeight: 800 },
    { width: 390, height: 844, columns: 2, maxFooterHeight: 950 },
    { width: 320, height: 568, columns: 2, maxFooterHeight: 1_000 },
  ] as const;

  for (const layout of footerLayouts) {
    await page.setViewportSize(layout);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const footerMetrics = await page.locator(".site-footer").evaluate((footer) => {
      const top = footer.querySelector<HTMLElement>(".footer-top");
      const footerBox = footer.getBoundingClientRect();

      return {
        height: Math.round(footerBox.height),
        columnCount: top
          ? getComputedStyle(top).gridTemplateColumns.split(" ").filter(Boolean).length
          : 0,
        left: footerBox.left,
        right: footerBox.right,
      };
    });

    expect(footerMetrics.height).toBeLessThanOrEqual(layout.maxFooterHeight);
    expect(footerMetrics.columnCount).toBe(layout.columns);
    expect(footerMetrics.left).toBeGreaterThanOrEqual(-1);
    expect(footerMetrics.right).toBeLessThanOrEqual(layout.width + 1);
  }
});

test("search and cart overlays use the complete dynamic viewport", async ({ page }) => {
  await acceptEssentialCookies(page);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Search", exact: true }).click();

  const search = page.getByRole("dialog", { name: "Search Bangla Blend" });
  await expect(search).toBeVisible();
  await page.waitForTimeout(350);
  const searchBox = await search.boundingBox();
  expect(searchBox).not.toBeNull();
  expect(searchBox!.x).toBeCloseTo(0, 0);
  expect(searchBox!.y).toBeCloseTo(0, 0);
  expect(searchBox!.width).toBeCloseTo(768, 0);
  expect(searchBox!.height).toBeCloseTo(1024, 0);
  await page.getByRole("button", { name: "Close search" }).click();

  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByRole("button", { name: /open cart/i }).click();

  const cart = page.getByRole("dialog", { name: "Shopping bag" });
  await expect(cart).toBeVisible();
  await page.waitForTimeout(400);
  const cartBox = await cart.boundingBox();
  expect(cartBox).not.toBeNull();
  expect(cartBox!.x).toBeCloseTo(0, 0);
  expect(cartBox!.y).toBeCloseTo(0, 0);
  expect(cartBox!.width).toBeCloseTo(320, 0);
  expect(cartBox!.height).toBeCloseTo(568, 0);
});
