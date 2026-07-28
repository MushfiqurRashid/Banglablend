import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { GIFTING_MODULE } from "../modules/gifting";
import type GiftingModuleService from "../modules/gifting/service";

export default async function giftOrderHandler({ event, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query") as { graph: (input: object) => Promise<{ data: Array<{ id: string; cart_id?: string; metadata?: Record<string, unknown> }> }> };
  const { data } = await query.graph({ entity: "order", fields: ["id", "cart_id", "metadata"], filters: { id: event.data.id } });
  const order = data[0];
  const metadata = order?.metadata;
  const recipient = metadata?.recipient as Record<string, unknown> | undefined;
  if (!order?.cart_id || metadata?.is_gift !== true || !recipient) return;
  const service = container.resolve<GiftingModuleService>(GIFTING_MODULE);
  const [existing] = await service.listGiftOrders({ cart_id: order.cart_id });
  if (existing) return;
  await service.createGiftOrders({ cart_id: order.cart_id, order_id: order.id, recipient_name: String(recipient.name ?? ""), recipient_telephone: String(recipient.telephone ?? ""), gift_message: recipient.message ? String(recipient.message) : undefined, hide_prices: recipient.hidePrices === true, preferred_delivery_date: recipient.preferredDeliveryDate ? new Date(String(recipient.preferredDeliveryDate)) : undefined, delivery_instructions: recipient.instructions ? String(recipient.instructions) : undefined });
}

export const config: SubscriberConfig = { event: "order.placed" };
