/* global URL, console, fetch, process */

import { chromium } from "@playwright/test";

const existingOrderId = process.env.CHECKOUT_SMOKE_ORDER_ID;
if (!existingOrderId && process.env.CHECKOUT_SMOKE_ALLOW_ORDER !== "true") {
  throw new Error("Set CHECKOUT_SMOKE_ALLOW_ORDER=true to create the marked verification order.");
}

const storefrontOrigin = process.env.STOREFRONT_SMOKE_ORIGIN ?? "http://localhost:3000";
const adminOrigin = (process.env.ADMIN_SMOKE_ORIGIN ?? "http://localhost:3100").replace(/\/+$/, "");
const adminEmail = process.env.ADMIN_SMOKE_EMAIL;
const adminPassword = process.env.ADMIN_SMOKE_PASSWORD;

if (!adminEmail || !adminPassword) {
  throw new Error("ADMIN_SMOKE_EMAIL and ADMIN_SMOKE_PASSWORD are required.");
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const diagnostics = [];

page.on("console", (message) => {
  if (["error", "warning"].includes(message.type())) {
    diagnostics.push(`console:${message.type()}:${message.text()}`);
  }
});
page.on("pageerror", (error) => diagnostics.push(`pageerror:${error.message}`));

try {
  let orderId = existingOrderId;
  if (!orderId) {
    await page.goto(`${storefrontOrigin}/shop`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    const addButton = page.locator("button.add-to-cart:not([disabled])").first();
    await addButton.waitFor({ state: "visible", timeout: 90_000 });

    const cartResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" && new URL(response.url()).pathname === "/api/cart",
      { timeout: 60_000 },
    );
    await addButton.click();
    const cartResponse = await cartResponsePromise;
    const cartPayload = await cartResponse.json();
    if (!cartResponse.ok() || !cartPayload.cart?.items?.length) {
      throw new Error(cartPayload.error ?? "The storefront did not add the product to the cart.");
    }

    const addedLine = cartPayload.cart.items[0];
    const cartDrawer = page.locator(".cart-drawer");
    await cartDrawer.waitFor({ state: "visible", timeout: 30_000 });
    await cartDrawer.getByText(addedLine.title, { exact: true }).waitFor({
      state: "visible",
      timeout: 30_000,
    });
    await cartDrawer.getByRole("link", { name: "Continue to checkout", exact: true }).click();

    await page.waitForURL((url) => url.pathname === "/checkout", { timeout: 60_000 });
    await page.locator("#checkout-email").fill("checkout-smoke@banglablend.local");
    await page.locator('input[name="shippingAddress.firstName"]').fill("Checkout");
    await page.locator('input[name="shippingAddress.lastName"]').fill("Verification");
    await page.locator('input[name="shippingAddress.address1"]').fill("1 Test Road");
    await page.locator('input[name="shippingAddress.city"]').fill("Dhaka");
    await page.locator('input[name="shippingAddress.province"]').fill("Dhaka");
    await page.locator('input[name="shippingAddress.postalCode"]').fill("1205");
    await page.locator('input[name="shippingAddress.phone"]').fill("01700000000");
    await page.locator('input[name="isGift"]').check();
    await page.locator('input[name="recipient.name"]').fill("Order Test Recipient");
    await page.locator('input[name="recipient.telephone"]').fill("01800000000");
    await page.locator('textarea[name="recipient.message"]').fill("Checkout integration test");
    await page.locator('input[name="recipient.hidePrices"]').check();
    await page
      .locator('textarea[name="recipient.instructions"]')
      .fill("Automated verification order - do not fulfill");
    await page.locator('input[name="termsAccepted"]').check();
    const initialShippingOption = page.getByRole("radio", { name: /Inside Dhaka.*BDT 80/i });
    await initialShippingOption.waitFor({ state: "visible", timeout: 30_000 });
    await initialShippingOption.check();

    const submitCheckout = async () => {
      const responsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname === "/api/checkout",
        { timeout: 90_000 },
      );
      await page.getByRole("button", { name: "Place order", exact: true }).click();
      const response = await responsePromise;
      return { response, payload: await response.json() };
    };

    let checkout = await submitCheckout();
    if (checkout.payload.requiresShippingSelection) {
      const shippingOption = page.locator('input[name="shippingOptionId"]').first();
      await shippingOption.waitFor({ state: "visible", timeout: 30_000 });
      await shippingOption.check();
      checkout = await submitCheckout();
    }
    if (!checkout.response.ok() || !checkout.payload.orderId || !checkout.payload.redirect) {
      throw new Error(checkout.payload.error ?? "Checkout did not create an order.");
    }

    orderId = checkout.payload.orderId;
    await page.waitForURL((url) => url.pathname === "/checkout/success", { timeout: 60_000 });

    const hydrationErrors = diagnostics.filter((entry) =>
      /hydrated|hydration mismatch|server rendered html/i.test(entry),
    );
    if (hydrationErrors.length) {
      throw new Error(`Hydration errors remained: ${hydrationErrors.join(" | ")}`);
    }
  }

  await page.goto(`${adminOrigin}/login`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  const emailInput = page.locator('input[name="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 90_000 });
  if (await emailInput.isVisible()) {
    await emailInput.fill(adminEmail);
    await page.locator('input[name="password"]').fill(adminPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 60_000 });
  }

  const orderResponse = await page.goto(`${adminOrigin}/orders/${encodeURIComponent(orderId)}`, { waitUntil: "networkidle", timeout: 90_000 });
  if (!orderResponse?.ok()) throw new Error(`Admin order page returned HTTP ${orderResponse?.status() ?? "unknown"}.`);
  const adminOrderText = await page.locator("body").innerText();
  if (
    !existingOrderId &&
    !["checkout-smoke@banglablend.local", "Checkout Verification", "Order Test Recipient", "Checkout integration test"].every((value) => adminOrderText.includes(value))
  ) {
    throw new Error("The completed order is missing checkout, address, or gift data in the admin order view.");
  }
  const businessReference = await page.locator("h1").first().textContent();
  if (!businessReference?.startsWith("order_")) throw new Error("The admin order view did not render a business reference.");

  console.log(
    JSON.stringify({
      add_to_cart: existingOrderId ? "SKIPPED (existing order mode)" : "OK",
      checkout: existingOrderId ? "SKIPPED (existing order mode)" : "OK",
      order_admin_integration: "OK",
      hydration: existingOrderId ? "SKIPPED (existing order mode)" : "OK",
      order: {
        id: orderId,
        reference: businessReference,
      },
    }),
  );
} finally {
  await browser.close();
}
