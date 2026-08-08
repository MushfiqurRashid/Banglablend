import { expect, test } from "@playwright/test";

test("animated overlays remain accessible and operable", async ({ page, isMobile }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (
      ["error", "warning"].includes(message.type()) &&
      /hydrated|hydration mismatch|server rendered html/i.test(message.text())
    ) {
      hydrationErrors.push(message.text());
    }
  });

  await page.goto("/");

  if (!isMobile) {
    await page.getByRole("button", { name: "Search", exact: true }).click();
    const searchDialog = page.getByRole("dialog", { name: "Search Bangla Blend" });
    await expect(searchDialog).toBeVisible();
    await expect(searchDialog).toHaveCSS("opacity", "1");
    await searchDialog.getByRole("button", { name: "Close search" }).click();
    await expect(searchDialog).toBeHidden();
  }

  await page.getByRole("button", { name: /open cart/i }).click();
  const cartDialog = page.getByRole("dialog", { name: "Shopping bag" });
  await expect(cartDialog).toBeVisible();
  await cartDialog.getByRole("button", { name: "Close cart" }).click();
  await expect(cartDialog).toBeHidden();

  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Main navigation" });
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: "Close menu" }).click();
    await expect(menu).toBeHidden();
  }

  expect(hydrationErrors).toEqual([]);
});
