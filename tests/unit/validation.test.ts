import { describe, expect, it } from "vitest";
import { checkoutSchema, contactSchema, inquirySchema } from "../../packages/validation/src/index";

describe("public input validation", () => {
  it("rejects malformed contact data", () => {
    expect(contactSchema.safeParse({ name: "", email: "bad", message: "x" }).success).toBe(false);
  });

  it("requires gift-recipient details when an order is a gift", () => {
    const result = checkoutSchema.safeParse({
      email: "buyer@example.com",
      shippingAddress: { firstName: "Buyer", lastName: "Name", address1: "1 Test Road", city: "Dhaka", countryCode: "BD", phone: "01700000000" },
      billingSameAsShipping: true,
      paymentMethod: "cod",
      isGift: true,
      termsAccepted: true
    });
    expect(result.success).toBe(false);
  });

  it("requires a billing address when it differs from delivery", () => {
    const result = checkoutSchema.safeParse({
      email: "buyer@example.com",
      shippingAddress: { firstName: "Buyer", lastName: "Name", address1: "1 Test Road", city: "Dhaka", countryCode: "BD", phone: "01700000000" },
      billingSameAsShipping: false,
      paymentMethod: "cod",
      isGift: false,
      termsAccepted: true
    });
    expect(result.success).toBe(false);
  });

  it("rejects impossible gift delivery dates", () => {
    const result = checkoutSchema.safeParse({
      email: "buyer@example.com",
      shippingAddress: { firstName: "Buyer", lastName: "Name", address1: "1 Test Road", city: "Dhaka", countryCode: "BD", phone: "01700000000" },
      billingSameAsShipping: true,
      paymentMethod: "cod",
      isGift: true,
      recipient: { name: "Recipient", telephone: "01800000000", preferredDeliveryDate: "2026-02-31", hidePrices: true },
      termsAccepted: true
    });
    expect(result.success).toBe(false);
  });

  it("accepts a categorized wholesale inquiry without trusting arbitrary types", () => {
    const result = inquirySchema.safeParse({ type: "wholesale", contactPerson: "Buyer", email: "buyer@example.com", company: "Sample retailer", notes: "Please send a wholesale catalogue and terms." });
    expect(result.success).toBe(true);
  });
});
