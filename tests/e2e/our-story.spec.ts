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

test("our story page presents its sections, imagery and supporting navigation", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");

  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Main navigation" });
    await menu.getByText("Our Story", { exact: true }).click();
    await menu.getByRole("link", { name: "View all Our Story" }).click();
  } else {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Our Story", exact: true })
      .click();
  }

  await expect(page).toHaveURL(/\/our-story$/);

  await expect(
    page.getByRole("heading", { level: 1, name: "Our Story", exact: true }),
  ).toBeVisible();

  const storyImages = [
    page.locator(".story-hero img"),
    page.locator("#about-bangla-blend img"),
    page.locator("#our-philosophy img"),
    page.locator("#our-impact img"),
    page.locator("#meet-annapurna img"),
    page.locator("#from-our-notes img"),
  ];

  for (const image of storyImages) {
    await expectImageToLoad(image);
  }

  const tabs = page.getByRole("navigation", { name: "Our Story sections" });
  const expectedTabs = [
    ["About Bangla Blend", "about-bangla-blend"],
    ["Our Philosophy", "our-philosophy"],
    ["Our Impact", "our-impact"],
    ["Meet Annapurna", "meet-annapurna"],
  ] as const;

  await expect(tabs.getByRole("link")).toHaveCount(expectedTabs.length);

  for (const [label, id] of expectedTabs) {
    const tab = tabs.getByRole("link", { name: label, exact: true });
    await expect(tab).toHaveAttribute("href", `#${id}`);
    await tab.click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }

  const expectedCtas = [
    [page.locator("#about-bangla-blend"), "Our journey", "/about-bangla-blend"],
    [page.locator("#our-philosophy"), "Our philosophy", "/our-story/our-philosophy"],
    [page.locator("#our-impact"), "See our impact", "/our-story/our-impact"],
    [page.locator("#meet-annapurna"), "Meet Annapurna", "/our-story/meet-annapurna"],
    [page.locator("#from-our-notes"), "Read our notes", "/journal"],
  ] as const;

  for (const [section, label, href] of expectedCtas) {
    await expect(section.getByRole("link", { name: label, exact: true })).toHaveAttribute(
      "href",
      href,
    );
  }

  for (const [section, label] of expectedCtas.slice(2)) {
    const link = section.getByRole("link", { name: label, exact: true });
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

  await page
    .locator("#our-impact")
    .getByRole("link", { name: "See our impact", exact: true })
    .click();
  await expect(page).toHaveURL(/\/our-story\/our-impact$/);
});

test("our standards and its legacy alias are removed", async ({ request }) => {
  const [standards, legacyAlias] = await Promise.all([
    request.get("/our-story/our-standards"),
    request.get("/quality-and-standards"),
  ]);

  expect(standards.status()).toBe(404);
  expect(legacyAlias.status()).toBe(404);
});
