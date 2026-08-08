/* global URL, console, process */

import { chromium } from "@playwright/test";

const origin = process.env.ADMIN_SMOKE_ORIGIN ?? "http://localhost:9000";
const email = process.env.ADMIN_SMOKE_EMAIL;
const password = process.env.ADMIN_SMOKE_PASSWORD;
const orderId = process.env.ORDER_ROADMAP_ID;
const expectedReference = process.env.ORDER_ROADMAP_REFERENCE;
const expectedAction = process.env.ORDER_ROADMAP_ACTION;
const screenshotPath = process.env.ORDER_ROADMAP_SCREENSHOT;

if (!email || !password || !orderId) {
  throw new Error(
    "ADMIN_SMOKE_EMAIL, ADMIN_SMOKE_PASSWORD, and ORDER_ROADMAP_ID are required.",
  );
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const diagnostics = [];

page.on("console", (message) => diagnostics.push(`console:${message.type()}:${message.text()}`));
page.on("pageerror", (error) => diagnostics.push(`pageerror:${error.message}`));
page.on("requestfailed", (request) =>
  diagnostics.push(`requestfailed:${request.url()}:${request.failure()?.errorText ?? "unknown"}`),
);

try {
  await page.goto(`${origin}/app`, { waitUntil: "commit", timeout: 90_000 });
  const emailInput = page.locator('input[name="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 90_000 });
  await emailInput.fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /continue with email/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 30_000 });

  await page.goto(`${origin}/app/orders/${encodeURIComponent(orderId)}`, {
    waitUntil: "commit",
    timeout: 90_000,
  });
  await page.getByText("Order roadmap", { exact: true }).waitFor({
    state: "visible",
    timeout: 90_000,
  });
  await page.getByText(`Internal ID: ${orderId}`, { exact: true }).waitFor({
    state: "visible",
    timeout: 30_000,
  });

  if (expectedReference) {
    await page.getByText(expectedReference, { exact: true }).first().waitFor({
      state: "visible",
      timeout: 30_000,
    });
  }
  if (expectedAction) {
    await page
      .getByTestId("order-roadmap")
      .getByRole("button", { name: expectedAction, exact: true })
      .waitFor({
        state: "visible",
        timeout: 30_000,
      });
  }

  if (screenshotPath) {
    await page.getByTestId("order-roadmap").screenshot({ path: screenshotPath });
  }

  if (expectedReference) {
    await page.goto(`${origin}/app/orders/details`, {
      waitUntil: "commit",
      timeout: 90_000,
    });
    await page.getByLabel("Order number, ID, or email", { exact: true }).fill(expectedReference);
    await page.getByRole("button", { name: "Search orders", exact: true }).click();
    await page.getByText(expectedReference, { exact: true }).first().waitFor({
      state: "visible",
      timeout: 30_000,
    });
  }

  const pageErrors = diagnostics.filter(
    (message) =>
      message.startsWith("pageerror:") ||
      (message.startsWith("requestfailed:") && !message.endsWith(":net::ERR_ABORTED")),
  );
  if (pageErrors.length) {
    throw new Error(`Order roadmap browser errors:\n${pageErrors.join("\n")}`);
  }

  console.log(
    JSON.stringify({
      order_roadmap: "OK",
      order_id: orderId,
      reference: expectedReference ?? "not asserted",
      next_action: expectedAction ?? "not asserted",
    }),
  );
} catch (error) {
  console.error(JSON.stringify({ url: page.url(), diagnostics }, null, 2));
  throw error;
} finally {
  await browser.close();
}
