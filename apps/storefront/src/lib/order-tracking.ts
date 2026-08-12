// Customer-facing order tracking steps. Trimmed port of the admin roadmap logic in
// apps/admin/src/lib/order-workflow.ts (buildOrderWorkflowView) -- same derivation rules, minus
// staff-only concepts (nextAction, exception messaging aimed at operators), with labels matching
// the customer account mockup's timeline: Order Placed, Confirmed, Processing, Out for Delivery,
// Delivered.

export type TrackingStepState = "complete" | "current" | "pending" | "exception";

export interface TrackingStep {
  key: "placed" | "confirmed" | "processing" | "out_for_delivery" | "delivered";
  label: string;
  state: TrackingStepState;
  at?: string;
}

export interface TrackingFulfillment {
  shipped_at: string | null;
  delivered_at: string | null;
  canceled_at: string | null;
}

export interface TrackingLineItem {
  quantity: number;
  fulfilled_quantity: number;
}

export interface TrackingOrder {
  created_at: string;
  payment_status: string;
  is_cod: boolean;
  canceled_at: string | null;
  status: string;
  items: TrackingLineItem[];
  fulfillments: TrackingFulfillment[];
}

export function buildOrderTrackingSteps(order: TrackingOrder): TrackingStep[] {
  const paymentReady = order.is_cod || ["authorized", "partially_captured", "captured", "partially_refunded"].includes(order.payment_status);
  const activeFulfillments = order.fulfillments.filter((f) => !f.canceled_at);
  const hasFulfillment = activeFulfillments.length > 0;
  const outstanding = order.items.reduce((sum, item) => sum + Math.max(0, item.quantity - item.fulfilled_quantity), 0);
  const allFulfilled = hasFulfillment && outstanding === 0;
  const allShipped = allFulfilled && activeFulfillments.every((f) => Boolean(f.shipped_at));
  const allDelivered = allFulfilled && activeFulfillments.every((f) => Boolean(f.delivered_at));
  const canceled = Boolean(order.canceled_at) || order.status === "canceled";

  const state = (complete: boolean, current: boolean): TrackingStepState => (canceled ? "exception" : complete ? "complete" : current ? "current" : "pending");

  return [
    { key: "placed", label: "Order Placed", state: canceled ? "exception" : "complete", at: order.created_at },
    { key: "confirmed", label: "Confirmed", state: state(paymentReady, !paymentReady) },
    { key: "processing", label: "Processing", state: state(allFulfilled, paymentReady && !allFulfilled) },
    { key: "out_for_delivery", label: "Out for Delivery", state: state(allShipped, hasFulfillment && !allShipped) },
    { key: "delivered", label: "Delivered", state: state(allDelivered, allShipped && !allDelivered) },
  ];
}
