/* global URL, console, fetch, process */

import { chromium } from "@playwright/test";

const existingOrderId = process.env.CHECKOUT_SMOKE_ORDER_ID;
if (!existingOrderId && process.env.CHECKOUT_SMOKE_ALLOW_ORDER !== "true") {
  throw new Error("Set CHECKOUT_SMOKE_ALLOW_ORDER=true to create the marked verification order.");
}

const storefrontOrigin = process.env.STOREFRONT_SMOKE_ORIGIN ?? "http://localhost:3000";
const adminOrigin = process.env.ADMIN_SMOKE_ORIGIN ?? "http://localhost:9000";
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
      .fill("Automated verification order — do not fulfill");
    await page.locator('input[name="termsAccepted"]').check();

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
      throw new Error(checkout.payload.error ?? "Checkout did not create a Medusa order.");
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

  await page.goto(`${adminOrigin}/app`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  const emailInput = page.locator('input[name="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 90_000 });
  if (await emailInput.isVisible()) {
    await emailInput.fill(adminEmail);
    await page.locator('input[name="password"]').fill(adminPassword);
    await page.getByRole("button", { name: /continue with email/i }).click();
    await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 60_000 });
  }

  const orderPayload = await page.evaluate(async (id) => {
    const fields = [
      "id",
      "display_id",
      "email",
      "status",
      "payment_status",
      "fulfillment_status",
      "total",
      "currency_code",
      "metadata",
      "+items",
      "*shipping_address",
      "*billing_address",
      "+shipping_methods",
      "+payment_collections",
      "+payment_collections.payment_sessions",
    ].join(",");
    const response = await fetch(
      `/admin/orders/${encodeURIComponent(id)}?fields=${encodeURIComponent(fields)}`,
      {
        credentials: "include",
      },
    );
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message ?? "Admin could not retrieve the order.");
    return payload;
  }, orderId);

  const order = orderPayload.order;
  const recipient = order?.metadata?.recipient;
  if (
    !order ||
    order.email !== "checkout-smoke@banglablend.local" ||
    !order.items?.length ||
    order.items[0].quantity !== 1 ||
    order.shipping_address?.first_name !== "Checkout" ||
    order.billing_address?.first_name !== "Checkout" ||
    order.metadata?.is_gift !== true ||
    recipient?.name !== "Order Test Recipient" ||
    !order.shipping_methods?.length ||
    !(order.total > 0)
  ) {
    throw new Error(`The completed order is missing checkout data: ${JSON.stringify(order)}`);
  }

  console.log(
    JSON.stringify({
      add_to_cart: existingOrderId ? "SKIPPED (existing order mode)" : "OK",
      checkout: existingOrderId ? "SKIPPED (existing order mode)" : "OK",
      order_admin_integration: "OK",
      hydration: existingOrderId ? "SKIPPED (existing order mode)" : "OK",
      order: {
        id: order.id,
        display_id: order.display_id,
        email: order.email,
        item: order.items[0].title,
        quantity: order.items[0].quantity,
        shipping_name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
        gift_recipient: recipient.name,
        total: order.total,
        currency_code: order.currency_code,
      },
    }),
  );
} finally {
  await browser.close();
}
