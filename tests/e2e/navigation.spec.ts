import { expect, test } from "@playwright/test";

test("primary navigation exposes both commerce and culture", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Bangla Blend home" }).first().locator("img")
  ).toBeVisible();

  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Main navigation" });
    await menu.getByText("Shop", { exact: true }).click();
    await expect(menu.getByRole("link", { name: "View all Shop" })).toBeVisible();
    await menu.getByText("Discover Bangladesh", { exact: true }).click();
    await expect(menu.getByRole("link", { name: "View all Discover Bangladesh" })).toBeVisible();
    await expect(menu.getByRole("combobox", { name: /deliver to/i })).toBeVisible();
    return;
  }

  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(navigation.getByRole("link", { name: "Shop", exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Discover Bangladesh", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: /deliver to/i })).toBeVisible();
});
