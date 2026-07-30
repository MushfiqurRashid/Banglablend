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

test("Our Impact uses the requested section sequence and color treatments", async ({ page }) => {
  await page.goto("/our-story/our-impact");

  await expect(
    page.getByRole("heading", { level: 1, name: "Our Impact", exact: true }),
  ).toBeVisible();

  const processSection = page.locator("#cleaning-processing");
  await expect(
    processSection.getByRole("heading", {
      level: 2,
      name: "Cleaning and Processing",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    processSection.getByRole("heading", { name: /our sourcing/i }),
  ).toHaveCount(0);

  const processBackground = await processSection.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  expect(processBackground).toBe("rgb(52, 68, 31)");

  const togetherSection = page.locator(".impact-together-section");
  await expect(
    togetherSection.getByRole("heading", {
      level: 2,
      name: "Stronger Together for a Better Tomorrow",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await togetherSection.evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe("rgb(255, 255, 255)");

  await expect(page.locator(".newsletter-band")).toBeHidden();
  await expect(page.getByRole("contentinfo")).toBeVisible();

  const images = page.locator(".impact-page img");
  await expect(images).toHaveCount(10);
  for (const image of await images.all()) {
    await expectImageToLoad(image);
  }

  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
