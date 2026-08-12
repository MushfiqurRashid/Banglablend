// Ported from the retired apps/medusa/src/lib/admin/order-workflow.ts, adapted to the new schema
// (orders/order_line_items/fulfillments tables instead of Medusa's order aggregate). Same roadmap
// semantics: placed -> payment -> fulfilled -> shipped -> delivered, COD vs online branching,
// cancel/return as exception states that lock the roadmap rather than being steps in it.

export type OrderRoadmapState = "complete" | "current" | "pending" | "exception";
export type OrderWorkflowAction = "fulfill" | "ship" | "deliver";

export interface OrderWorkflowLineItem {
  id: string;
  quantity: number;
  fulfilled_quantity: number;
}

export interface OrderWorkflowFulfillment {
  id: string;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  canceled_at: string | null;
}

export interface OrderWorkflowRecord {
  id: string;
  display_id: number;
  status: string;
  payment_status: string;
  canceled_at: string | null;
  created_at: string;
  items: OrderWorkflowLineItem[];
  fulfillments: OrderWorkflowFulfillment[];
  is_cod: boolean;
}

export interface OrderRoadmapStep {
  key: "placed" | "payment" | "fulfilled" | "shipped" | "delivered";
  label: string;
  description: string;
  state: OrderRoadmapState;
  at?: string;
}

export interface OrderWorkflowView {
  reference: string;
  steps: OrderRoadmapStep[];
  nextAction: { type: OrderWorkflowAction; label: string; confirmation: string; fulfillmentId?: string } | null;
  exception: { label: string; description: string } | null;
}

export function formatBusinessOrderReference(displayId?: number | string | null, fallback = "order_pending") {
  const numericId = Number(displayId);
  if (!Number.isInteger(numericId) || numericId < 1) return fallback;
  return `order_${String(numericId).padStart(2, "0")}`;
}

export function getOutstandingItems(order: OrderWorkflowRecord) {
  return order.items.flatMap((item) => {
    const remaining = Math.max(0, item.quantity - item.fulfilled_quantity);
    return remaining > 0 ? [{ id: item.id, quantity: remaining }] : [];
  });
}

export function buildOrderWorkflowView(order: OrderWorkflowRecord): OrderWorkflowView {
  const paymentReady = order.is_cod || ["authorized", "partially_captured", "captured", "partially_refunded"].includes(order.payment_status);
  const activeFulfillments = order.fulfillments.filter((f) => !f.canceled_at);
  const unshipped = activeFulfillments.find((f) => !f.shipped_at);
  const undelivered = activeFulfillments.find((f) => f.shipped_at && !f.delivered_at);
  const hasFulfillment = activeFulfillments.length > 0;
  const outstanding = getOutstandingItems(order);
  const allFulfilled = hasFulfillment && outstanding.length === 0;
  const allShipped = allFulfilled && activeFulfillments.every((f) => Boolean(f.shipped_at));
  const allDelivered = allFulfilled && activeFulfillments.every((f) => Boolean(f.delivered_at));
  const canceled = Boolean(order.canceled_at) || order.status === "canceled";

  let nextAction: OrderWorkflowView["nextAction"] = null;
  if (!canceled && paymentReady) {
    if (unshipped) {
      nextAction = { type: "ship", label: "Mark as shipped", confirmation: "Confirm the packed items have been handed to the approved carrier.", fulfillmentId: unshipped.id };
    } else if (undelivered) {
      nextAction = { type: "deliver", label: "Mark as delivered", confirmation: "Confirm delivery only after carrier or recipient evidence is available.", fulfillmentId: undelivered.id };
    } else if (outstanding.length) {
      nextAction = { type: "fulfill", label: "Mark packed / fulfilled", confirmation: "Confirm payment/COD approval, inventory, and the delivery address have been reviewed." };
    }
  }

  const exception = canceled
    ? { label: "Order canceled", description: "Fulfillment actions are locked." }
    : !paymentReady
      ? { label: "Payment review required", description: "Do not fulfill an online-payment order until it is authorized or captured." }
      : null;

  const normalState = (complete: boolean, current: boolean): OrderRoadmapState => (canceled ? "exception" : complete ? "complete" : current ? "current" : "pending");
  const paymentDescription = order.is_cod
    ? "Cash on Delivery approved; collect and reconcile with delivery evidence."
    : paymentReady
      ? `Online payment ${order.payment_status.replaceAll("_", " ")}.`
      : "Waiting for verified online payment authorization or capture.";

  return {
    reference: formatBusinessOrderReference(order.display_id, order.id),
    steps: [
      { key: "placed", label: "Order placed", description: "Customer, address, items, and price recorded.", state: canceled ? "exception" : "complete", at: order.created_at },
      { key: "payment", label: order.is_cod ? "COD approved" : "Payment verified", description: paymentDescription, state: normalState(paymentReady, !paymentReady) },
      { key: "fulfilled", label: "Packed / fulfilled", description: "Items allocated and prepared for dispatch.", state: normalState(allFulfilled, paymentReady && !allFulfilled) },
      { key: "shipped", label: "Shipped", description: "Order handed to the carrier.", state: normalState(allShipped, hasFulfillment && !allShipped) },
      { key: "delivered", label: "Delivered", description: "Carrier or recipient delivery confirmation recorded.", state: normalState(allDelivered, allShipped && !allDelivered) },
    ],
    nextAction,
    exception,
  };
}
