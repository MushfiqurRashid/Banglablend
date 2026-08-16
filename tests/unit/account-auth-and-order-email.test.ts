import { describe, expect, it } from "vitest";
import {
  CUSTOMER_DASHBOARD_PATH,
  customerAuthDestination,
} from "../../apps/storefront/src/lib/auth/destination";
import { buildOrderEmails } from "../../apps/storefront/src/lib/email/order-messages";

describe("customer authentication destination", () => {
  it("sends Google and password authentication to the customer dashboard", () => {
    expect(CUSTOMER_DASHBOARD_PATH).toBe("/account");
    expect(customerAuthDestination(null)).toBe("/account");
    expect(customerAuthDestination("https://attacker.example")).toBe("/account");
  });

  it("keeps the account password-recovery destination available", () => {
    expect(customerAuthDestination("/account/reset-password")).toBe("/account/reset-password");
  });
});

describe("order email notifications", () => {
  it("builds an immediate merchant notification with order and delivery details", () => {
    const emails = buildOrderEmails({
      orderId: "6f847b26-c901-4a0f-a89b-3e894b826f27",
      orderReference: "order_42",
      customerEmail: "buyer@example.com",
      customerName: "Test Buyer",
      customerPhone: "+8801700000000",
      deliveryAddress: ["12 Test Road", "Dhaka", "BD"],
      deliveryMethod: "Standard delivery",
      paymentMethod: "Cash on Delivery — payment due at delivery",
      currencyCode: "BDT",
      subtotal: 400,
      shippingTotal: 80,
      total: 480,
      lines: [{ title: "Hathazari Red Chilli Powder", variantTitle: "100 g", quantity: 2, unitPrice: 200 }],
      merchantEmail: "banglablend@gmail.com",
      contactEmail: "banglablend@gmail.com",
      adminOrderUrl: "https://bpanel.banglablend.store/orders/6f847b26-c901-4a0f-a89b-3e894b826f27",
    });

    expect(emails.customer.to).toBe("buyer@example.com");
    expect(emails.merchant).toMatchObject({
      to: "banglablend@gmail.com",
      replyTo: "buyer@example.com",
      subject: "New order order_42 — 480.00 BDT",
      idempotencyKey: "merchant-order-received/6f847b26-c901-4a0f-a89b-3e894b826f27",
    });
    expect(emails.merchant.text).toContain("2 x Hathazari Red Chilli Powder (100 g) — 400.00 BDT");
    expect(emails.merchant.text).toContain("Open in admin: https://bpanel.banglablend.store/orders/");
  });
});
