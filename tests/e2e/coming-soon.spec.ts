import { expect, test } from "@playwright/test";

const comingSoonRoutes = [
  ["/discover-bangladesh/food-heritage", "Food Heritage"],
  ["/discover-bangladesh/regional-flavours", "Regional Flavours"],
  ["/discover-bangladesh/ingredient-stories", "Ingredient Stories"],
  ["/discover-bangladesh/farmer-sourcing-stories", "Farmer & Sourcing Stories"],
  ["/discover-bangladesh/cooking-guides", "Cooking Guides"],
  ["/discover-bangladesh/festivals-seasons", "Festivals & Seasons"],
  ["/discover-bangladesh/behind-bangla-blend", "Behind Bangla Blend"],
  ["/gifts", "Gifts"],
  ["/gifts/gift-sets", "Gift Sets"],
  ["/gifts/regional-gifts", "Regional Gifts"],
  ["/gifts/corporate", "Corporate Gifting"],
  ["/our-story/meet-annapurna", "Meet Annapurna"],
  ["/wholesale", "Wholesale"],
] as const;

test("requested editorial, gifting and partnership pages are coming soon", async ({ request }) => {
  test.setTimeout(120_000);

  for (const [href, title] of comingSoonRoutes) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
    const body = await response.text();
    expect(body, href).toContain("Coming soon");
    expect(body, href).toContain(title.replace("&", "&amp;"));
  }
});

test("the gift shop uses the shared premium coming soon presentation", async ({ page }) => {
  await page.context().addCookies([
    {
      name: "bb_cookie_choice",
      value: "essential",
      url: "http://localhost:3000",
    },
  ]);
  await page.goto("/gifts");

  await expect(page.getByRole("heading", { level: 1, name: "Gifts" })).toBeVisible();
  await expect(page.getByText("Coming soon", { exact: true })).toBeVisible();
  await expect(page.getByText("The art of giving", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "A premium Bangla Blend gift presentation" })).toBeVisible();
  await expect(page.getByRole("link", { name: /explore the shop/i })).toHaveAttribute(
    "href",
    "/shop",
  );

  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
