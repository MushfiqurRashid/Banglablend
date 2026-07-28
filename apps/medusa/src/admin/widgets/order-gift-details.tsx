import { useEffect, useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types";
import { Badge, Container, Heading, Text } from "@medusajs/ui";

interface GiftOrder {
  recipient_name: string;
  recipient_telephone: string;
  gift_message?: string | null;
  hide_prices: boolean;
  packaging_selection?: string | null;
  preferred_delivery_date?: string | null;
  delivery_instructions?: string | null;
  occasion?: string | null;
}

const OrderGiftDetails = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const [gift, setGift] = useState<GiftOrder | null>();
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/admin/gift-orders/${encodeURIComponent(order.id)}`, { credentials: "include", signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ gift_order: GiftOrder | null }> : Promise.reject(new Error("Gift details unavailable")))
      .then((payload) => setGift(payload.gift_order))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setGift(null); });
    return () => controller.abort();
  }, [order.id]);

  if (gift === undefined) return <Container><Heading level="h2">Gift & recipient details</Heading><Text className="mt-2 text-ui-fg-subtle">Loading recipient instructions…</Text></Container>;
  if (gift === null) return null;
  return <Container><div className="flex items-center justify-between"><Heading level="h2">Gift & recipient details</Heading><Badge color="purple">Gift order</Badge></div><div className="mt-4 flex flex-col gap-y-3"><div><Text weight="plus">Recipient</Text><Text className="text-ui-fg-subtle">{gift.recipient_name} · {gift.recipient_telephone}</Text></div>{gift.gift_message ? <div><Text weight="plus">Message</Text><Text className="text-ui-fg-subtle">{gift.gift_message}</Text></div> : null}{gift.preferred_delivery_date ? <div><Text weight="plus">Preferred delivery</Text><Text className="text-ui-fg-subtle">{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(gift.preferred_delivery_date))}</Text></div> : null}{gift.delivery_instructions ? <div><Text weight="plus">Delivery instructions</Text><Text className="text-ui-fg-subtle">{gift.delivery_instructions}</Text></div> : null}{gift.packaging_selection ? <div><Text weight="plus">Packaging</Text><Text className="text-ui-fg-subtle">{gift.packaging_selection}</Text></div> : null}<Text className="text-ui-fg-subtle">Prices: {gift.hide_prices ? "hide from recipient" : "standard packing slip"}</Text></div></Container>;
};

export const config = defineWidgetConfig({ zone: "order.details.side.after", id: "bangla-blend:order-gift-details" });
export default OrderGiftDetails;
