import { expect, test } from "@playwright/test";

test("gift page presents the upcoming collection", async ({ page }) => {
  await page.addInitScript(() => {
    document.cookie = "bb_cookie_choice=essential; Path=/; SameSite=Lax";
  });
  await page.goto("/gifts");

  await expect(
    page.getByRole("heading", { name: "Gifts worth gathering around.", level: 1 }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".gift-hero-media img")
        .evaluate(
          (image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await expect(page.getByText("Coming soon", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Register your interest" }).first()).toBeVisible();
  await expect(page.locator(".shop-product-card")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No gifts match those filters" })).toHaveCount(0);
});
