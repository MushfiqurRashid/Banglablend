import { expect, test } from "@playwright/test";

test("About Bangla Blend is a separate footer-linked page", async ({ page }) => {
  await page.goto("/");

  const aboutLink = page
    .locator("footer")
    .getByRole("link", { name: "About Bangla Blend", exact: true });
  await expect(aboutLink).toHaveAttribute("href", "/about-bangla-blend");

  await page.goto("/about-bangla-blend");
  await expect(
    page.getByRole("heading", { name: /More Than Spices\.\s+It's Our Heritage\./, level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /honour Bangladesh's rich culinary heritage/i }))
    .toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A Personal Journey Back to Our Roots", level: 2 }),
  ).toBeVisible();
  await expect(page.locator(".about-brand-value-grid article")).toHaveCount(4);
  await expect(page.locator(".about-brand-difference-grid article")).toHaveCount(5);
  await expect(page.locator(".about-brand-timeline li")).toHaveCount(5);

  await page.goto("/our-story");
  await expect(page.getByRole("heading", { name: "Our Story", level: 1 })).toBeVisible();
});
