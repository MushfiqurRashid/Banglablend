import type { TransactionalEmail } from "./server";

export interface OrderEmailLine {
  title: string;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
}

interface OrderEmailInput {
  orderId: string;
  orderReference: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string[];
  deliveryMethod: string;
  paymentMethod: string;
  currencyCode: string;
  subtotal: number;
  shippingTotal: number;
  total: number;
  lines: OrderEmailLine[];
  merchantEmail: string;
  adminOrderUrl?: string;
  contactEmail: string;
}

function amount(value: number, currencyCode: string) {
  return `${value.toFixed(2)} ${currencyCode}`;
}

export function buildOrderEmails(input: OrderEmailInput): {
  customer: TransactionalEmail;
  merchant: TransactionalEmail;
} {
  const itemLines = input.lines.length
    ? input.lines.map(
        (line) =>
          `- ${line.quantity} x ${line.title}${line.variantTitle ? ` (${line.variantTitle})` : ""} — ${amount(line.unitPrice * line.quantity, input.currencyCode)}`,
      )
    : ["- Item details are available in the admin dashboard."];

  return {
    customer: {
      to: input.customerEmail,
      subject: `Bangla Blend received ${input.orderReference}`,
      idempotencyKey: `order-received/${input.orderId}`,
      text: [
        `Thank you. We received ${input.orderReference}.`,
        `Total: ${amount(input.total, input.currencyCode)}`,
        `Delivery method: ${input.deliveryMethod}`,
        `Payment method: ${input.paymentMethod}`,
        `You can contact us at ${input.contactEmail}.`,
      ].join("\n\n"),
    },
    merchant: {
      to: input.merchantEmail,
      replyTo: input.customerEmail,
      subject: `New order ${input.orderReference} — ${amount(input.total, input.currencyCode)}`,
      idempotencyKey: `merchant-order-received/${input.orderId}`,
      text: [
        "A new storefront order has been placed.",
        `Order: ${input.orderReference}`,
        `Customer: ${input.customerName}`,
        `Email: ${input.customerEmail}`,
        `Telephone: ${input.customerPhone}`,
        `Payment: ${input.paymentMethod}`,
        `Delivery method: ${input.deliveryMethod}`,
        "Delivery address:",
        ...input.deliveryAddress,
        "",
        "Items:",
        ...itemLines,
        "",
        `Subtotal: ${amount(input.subtotal, input.currencyCode)}`,
        `Shipping: ${amount(input.shippingTotal, input.currencyCode)}`,
        `Total: ${amount(input.total, input.currencyCode)}`,
        ...(input.adminOrderUrl ? ["", `Open in admin: ${input.adminOrderUrl}`] : []),
      ].join("\n"),
    },
  };
}
