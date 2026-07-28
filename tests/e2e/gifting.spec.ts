import { expect, test } from "@playwright/test";

test("gift journey supports discovery, price filtering and corporate gifting", async ({ page }) => {
  await page.addInitScript(() => {
    document.cookie = "bb_cookie_choice=essential; Path=/; SameSite=Lax";
  });
  await page.goto("/gifts");

  await expect(page.getByRole("heading", { name: "Give a whole pantry.", level: 1 })).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".gift-hero-media img")
        .evaluate(
          (image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await expect(page.getByRole("link", { name: /corporate gifts/i }).first()).toBeVisible();
  await expect(page.locator(".shop-product-card")).toHaveCount(8);

  await page.getByRole("button", { name: /Under ৳1,000/i }).click();

  await expect(page.getByText("Showing 1–4 of 4 gifts")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chai Adda Gift Set" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Host's Spice Sampler" })).toBeVisible();
});
