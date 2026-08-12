import { describe, expect, it } from "vitest";
import { canDownloadInvoice, createInvoicePdf, invoiceFilename, type InvoiceInput } from "../src/lib/invoice";

const input: InvoiceInput = {
  order: {
    id: "09d67835-f3b1-4758-854f-36a2ab15ddab",
    display_id: 11,
    email: "buyer@example.com",
    currency_code: "bdt",
    subtotal: 350,
    shipping_total: 50,
    tax_total: 0,
    total: 400,
    payment_status: "authorized",
    fulfillment_status: "fulfilled",
    canceled_at: null,
    created_at: "2026-08-12T08:24:15.000Z",
  },
  items: [
    {
      title: "Shahi Garam Masala",
      variant_title: "100 g",
      sku: "SHAHI-100",
      quantity: 1,
      fulfilled_quantity: 1,
      unit_price: 350,
    },
  ],
  seller: {
    name: "Bangla Blend",
    tagline: "The Taste of Bangladesh",
    addressLines: ["House 12, Road 5", "Dhaka 1205", "Bangladesh"],
    email: "hello@banglablend.com",
    phone: "+880 1700 000000",
  },
  billingAddress: null,
  shippingAddress: {
    first_name: "Amina",
    last_name: "Rahman",
    company: null,
    address_1: "12 Market Road",
    address_2: null,
    city: "Dhaka",
    province: "Dhaka",
    postal_code: "1205",
    country_code: "bd",
    phone: "+8801700000000",
  },
  paymentMethod: "Cash on Delivery",
  fulfilledAt: "2026-08-12T10:00:00.000Z",
};

describe("fulfilled order invoice", () => {
  it("only becomes available after every item is fulfilled", () => {
    expect(canDownloadInvoice(input.order, input.items)).toBe(true);
    expect(canDownloadInvoice(input.order, [{ quantity: 2, fulfilled_quantity: 1 }])).toBe(false);
    expect(canDownloadInvoice({ canceled_at: "2026-08-12T11:00:00.000Z" }, input.items)).toBe(false);
  });

  it("uses the business order reference in its filename", () => {
    expect(invoiceFilename(11)).toBe("invoice-order_11.pdf");
  });

  it("generates a real PDF document", async () => {
    const bytes = await createInvoicePdf(input);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(1500);
  });
});
