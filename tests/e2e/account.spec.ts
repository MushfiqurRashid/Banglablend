import { expect, test } from "@playwright/test";

test("account entry points render without exposing tokens", async ({ page }) => {
  await page.goto("/account/login");
  await expect(page.getByRole("heading", { name: "Welcome back", level: 2 })).toBeVisible();
  const accountForm = page.locator("form.auth-card");
  await expect(accountForm.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect(accountForm.getByRole("textbox", { name: "Email", exact: true })).toBeVisible();
  await expect(accountForm.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(
    accountForm.locator('button[type="submit"] + .auth-divider + a.google-auth-button'),
  ).toBeVisible();
});

test("account registration offers a low-friction Google or email path", async ({ page }) => {
  await page.goto("/account/register");

  const accountForm = page.locator("form.auth-card");
  await expect(page.getByRole("heading", { name: "Create your account", level: 2 })).toBeVisible();
  await expect(
    accountForm.getByRole("link", { name: "Continue with Google" }),
  ).toHaveAttribute("href", /\/auth\/google$/);
  await expect(accountForm.getByRole("button", { name: "Create account" })).toBeVisible();
  await expect(
    accountForm.locator('button[type="submit"] + .auth-divider + a.google-auth-button'),
  ).toBeVisible();
  await expect(
    accountForm.getByText("Use at least 10 characters for your password."),
  ).toBeVisible();
});
