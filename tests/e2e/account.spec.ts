import { expect, test } from "@playwright/test";

test("account entry points render without exposing tokens", async ({ page }) => {
  await page.goto("/account/login");
  await expect(page.getByRole("heading", { name: "Welcome back", level: 2 })).toBeVisible();
  const accountForm = page.locator("form.auth-card");
  await expect(accountForm.getByRole("textbox", { name: "Email", exact: true })).toBeVisible();
  await expect(accountForm.getByLabel("Password", { exact: true })).toBeVisible();
});
