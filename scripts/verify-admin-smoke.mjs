/* global URL, console, process, window */

import { chromium } from "@playwright/test";
import { resolve } from "node:path";

const origin = process.env.ADMIN_SMOKE_ORIGIN ?? "http://localhost:9000";
const email = process.env.ADMIN_SMOKE_EMAIL;
const password = process.env.ADMIN_SMOKE_PASSWORD;

if (!email || !password) {
  throw new Error("ADMIN_SMOKE_EMAIL and ADMIN_SMOKE_PASSWORD are required.");
}

const checks = [
  ["dashboard", "/app/superadmin", "Bangla Blend Dashboard"],
  ["new_orders", "/app/orders/new", "New Orders"],
  ["order_details", "/app/orders/details", "Order Details"],
  ["customer_profile", "/app/customers/profile", "Customer Profile"],
  ["product_create", "/app/products/create", "Create a storefront product"],
  ["storefront_catalogs", "/app/superadmin/catalogs", "Storefront catalogs"],
  ["edit_stock", "/app/inventory/edit-stock", "Edit Stock"],
  ["content", "/app/content", "Content"],
  ["homepage", "/app/content/homepage", "Homepage"],
  ["reports", "/app/reports", "Reports"],
  ["users", "/app/users", "Users"],
  ["settings", "/app/application-settings", "Settings"],
];

const navigationChecks = [
  ["orders", "/app/orders/new", ["All Orders", "New Orders", "Order Details"]],
  ["products", "/app/products", ["All Products", "Tags", "Product Editor"]],
  ["customers", "/app/customers", ["All Customers", "Customer Tags", "Customer Profile"]],
  ["inventory", "/app/inventory", ["Inventory List", "Edit Stock"]],
  ["content", "/app/content", ["Homepage", "Pages", "Content Library"]],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = {};
const diagnostics = [];

page.on("console", (message) => diagnostics.push(`console:${message.type()}:${message.text()}`));
page.on("pageerror", (error) => diagnostics.push(`pageerror:${error.message}`));
page.on("requestfailed", (request) =>
  diagnostics.push(`requestfailed:${request.url()}:${request.failure()?.errorText ?? "unknown"}`),
);

try {
  await page.goto(`${origin}/app`, { waitUntil: "commit", timeout: 90_000 });

  const emailInput = page.locator('input[name="email"]');
  try {
    await emailInput.waitFor({ state: "visible", timeout: 90_000 });
  } catch (error) {
    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "<body unavailable>");
    console.error(
      JSON.stringify({ url: page.url(), body: bodyText.slice(0, 1_000), diagnostics }, null, 2),
    );
    throw error;
  }
  if (await emailInput.isVisible()) {
    await emailInput.fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: /continue with email/i }).click();
    await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 30_000 });
  }

  for (const [key, path, text] of checks) {
    await page.goto(`${origin}${path}`, { waitUntil: "commit", timeout: 90_000 });
    await page.getByText(text, { exact: true }).first().waitFor({
      state: "visible",
      timeout: 60_000,
    });
    results[key] = "OK";
    if (key === "product_create") {
      const redirectedPath = new URL(page.url()).pathname;
      if (redirectedPath !== "/app/superadmin/catalog/create") {
        throw new Error(
          `The standard product creator did not redirect to the guided creator (landed on ${redirectedPath}).`,
        );
      }
      results.product_create_redirect = "OK";
      await page.getByText("Additional storefront catalogs", { exact: true }).waitFor({
        state: "visible",
        timeout: 30_000,
      });
      results.product_catalog_assignments = "OK";

      const uploadResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname === "/admin/uploads",
        { timeout: 60_000 },
      );
      await page
        .locator('input[type="file"][accept*="image/webp"]')
        .setInputFiles(
          resolve("apps/storefront/public/images/products/mezban-masala-product.webp"),
        );
      const uploadResponse = await uploadResponsePromise;
      if (!uploadResponse.ok()) {
        throw new Error(`The product form upload failed with status ${uploadResponse.status()}.`);
      }
      await page.getByText("mezban-masala-product.webp", { exact: true }).waitFor({
        state: "visible",
        timeout: 30_000,
      });
      await page.getByAltText("Selected product preview", { exact: true }).first().waitFor({
        state: "visible",
        timeout: 30_000,
      });
      await page.getByText("Upload complete", { exact: true }).waitFor({
        state: "visible",
        timeout: 30_000,
      });
      const previewLoaded = await page
        .getByAltText("Selected product preview", { exact: true })
        .first()
        .evaluate((image) => image.complete && image.naturalWidth > 0);
      if (!previewLoaded) throw new Error("The uploaded product image could not be displayed.");
      results.product_image_picker = "OK";
      results.product_image_upload = "OK";

      const uploadArea = page.locator("#product-image-upload").locator("xpath=..");
      const removeResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === "DELETE" &&
          new URL(response.url()).pathname.startsWith("/admin/uploads/"),
        { timeout: 30_000 },
      );
      await uploadArea.getByRole("button", { name: "Remove", exact: true }).click();
      const removeResponse = await removeResponsePromise;
      if (!removeResponse.ok()) {
        throw new Error(`The product form cleanup failed with status ${removeResponse.status()}.`);
      }
      await uploadArea.getByText("Upload product image", { exact: true }).waitFor({
        state: "visible",
        timeout: 30_000,
      });
      results.product_image_remove = "OK";
    }
    if (key === "storefront_catalogs") {
      await page.getByText("Build a Box", { exact: true }).first().waitFor({
        state: "visible",
        timeout: 30_000,
      });
      results.build_a_box_catalog = "OK";

      const smokeCatalogName = `Admin Smoke ${Date.now()}`;
      await page.getByLabel(/Catalog name/).fill(smokeCatalogName);
      await page.getByRole("button", { name: "Create catalog", exact: true }).click();
      const smokeCatalogHeading = page.getByRole("heading", {
        name: smokeCatalogName,
        exact: true,
      });
      await smokeCatalogHeading.waitFor({ state: "visible", timeout: 30_000 });
      results.catalog_create = "OK";

      let smokeCatalogCard = smokeCatalogHeading.locator(
        "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' rounded-lg ') and contains(concat(' ', normalize-space(@class), ' '), ' border ')][1]",
      );
      await smokeCatalogCard
        .getByRole("button", { name: "Add assigned product", exact: true })
        .click();
      await page.waitForURL((url) => Boolean(url.searchParams.get("catalog")), {
        timeout: 30_000,
      });
      const smokeCatalogAssignment = page
        .getByText(smokeCatalogName, { exact: true })
        .locator("xpath=ancestor::label[1]")
        .locator('input[type="checkbox"]');
      await smokeCatalogAssignment.waitFor({ state: "visible", timeout: 30_000 });
      if (!(await smokeCatalogAssignment.isChecked())) {
        throw new Error("The selected catalog was not preselected in the product creator.");
      }
      results.catalog_assignment_handoff = "OK";

      await page.goto(`${origin}/app/superadmin/catalogs`, {
        waitUntil: "commit",
        timeout: 90_000,
      });
      await smokeCatalogHeading.waitFor({ state: "visible", timeout: 30_000 });
      smokeCatalogCard = smokeCatalogHeading.locator(
        "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' rounded-lg ') and contains(concat(' ', normalize-space(@class), ' '), ' border ')][1]",
      );
      page.once("dialog", (dialog) => dialog.accept());
      await smokeCatalogCard.getByRole("button", { name: "Delete catalog", exact: true }).click();
      await smokeCatalogHeading.waitFor({ state: "hidden", timeout: 30_000 });
      results.catalog_delete = "OK";
    }
  }

  for (const [key, path, labels] of navigationChecks) {
    await page.goto(`${origin}${path}`, { waitUntil: "commit", timeout: 90_000 });
    const navigation = page.locator("nav").first();
    await navigation.waitFor({ state: "visible", timeout: 60_000 });
    for (const label of labels) {
      await navigation.getByText(label, { exact: true }).waitFor({
        state: "visible",
        timeout: 60_000,
      });
    }
    results[`navigation_${key}`] = "OK";
  }

  await page.goto(`${origin}/app/superadmin`, { waitUntil: "commit", timeout: 90_000 });
  await page.getByText("Bangla Blend Dashboard", { exact: true }).waitFor({
    state: "visible",
    timeout: 60_000,
  });
  const settingsCount = await page.getByText("Settings", { exact: true }).evaluateAll(
    (elements) =>
      elements.filter((element) => {
        const style = window.getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          bounds.width > 0 &&
          bounds.height > 0
        );
      }).length,
  );
  if (settingsCount !== 1) {
    throw new Error(`Expected one Settings sidebar entry, found ${settingsCount}.`);
  }
  results.navigation_settings = "OK (1 entry)";

  await page.goto(`${origin}/docs`, { waitUntil: "commit", timeout: 90_000 });
  await page.locator(".swagger-ui").waitFor({ state: "visible", timeout: 60_000 });
  results.swagger = "OK";

  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
