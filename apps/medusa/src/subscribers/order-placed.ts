import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { createEmailAdapter } from "../lib/email/adapter";

interface OrderRecord {
  id: string;
  display_id?: number;
  email?: string;
  total?: number;
  currency_code?: string;
}

export default async function orderPlacedHandler({ event, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  const query = container.resolve("query") as { graph: (input: object) => Promise<{ data: OrderRecord[] }> };
  const { data } = await query.graph({ entity: "order", fields: ["id", "display_id", "email", "total", "currency_code"], filters: { id: event.data.id } });
  const order = data[0];
  if (!order?.email) { logger.warn(`Order ${event.data.id} has no customer email for confirmation.`); return; }
  if (!process.env.EMAIL_PROVIDER) { logger.warn(`Order ${event.data.id} was placed, but transactional email is not configured.`); return; }
  const reference = order.display_id ? `#${order.display_id}` : order.id;
  const total = typeof order.total === "number" && order.currency_code ? new Intl.NumberFormat("en-BD", { style: "currency", currency: order.currency_code.toUpperCase() }).format(order.total) : "shown in your order account";
  await createEmailAdapter().send({
    to: order.email,
    subject: `Bangla Blend order ${reference} received`,
    html: `<p>Thank you. We received Bangla Blend order <strong>${reference}</strong>.</p><p>Order total: ${total}</p><p>Payment and fulfillment updates will follow after our server verifies the transaction. A redirect from the payment provider never confirms payment on its own.</p>`,
    text: `Thank you. We received Bangla Blend order ${reference}.\nOrder total: ${total}\n\nPayment and fulfillment updates will follow after our server verifies the transaction. A redirect from the payment provider never confirms payment on its own.`,
    idempotencyKey: `bangla-blend-order-received-${order.id}`
  });
  logger.info(`Order confirmation accepted for order ${order.id}.`);
}

export const config: SubscriberConfig = { event: "order.placed" };
