export type OrderWorkflowAction = "fulfill" | "ship" | "deliver";
export type OrderRoadmapState = "complete" | "current" | "pending" | "exception";

export interface OrderWorkflowLineItem {
  id: string;
  quantity: number;
  detail?: {
    fulfilled_quantity?: number | string | null;
  } | null;
}

export interface OrderWorkflowFulfillmentItem {
  id: string;
  line_item_id?: string | null;
  quantity: number | string;
}

export interface OrderWorkflowFulfillment {
  id: string;
  packed_at?: string | Date | null;
  shipped_at?: string | Date | null;
  delivered_at?: string | Date | null;
  canceled_at?: string | Date | null;
  items?: OrderWorkflowFulfillmentItem[];
}

export interface OrderWorkflowRecord {
  id: string;
  display_id?: number | string | null;
  custom_display_id?: string | null;
  status: string;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  created_at?: string | Date | null;
  canceled_at?: string | Date | null;
  items?: OrderWorkflowLineItem[];
  fulfillments?: OrderWorkflowFulfillment[];
  payment_collections?: Array<{
    payments?: Array<{ provider_id?: string | null }>;
  }>;
}

export interface OrderRoadmapStep {
  key: "placed" | "payment" | "fulfilled" | "shipped" | "delivered";
  label: string;
  description: string;
  state: OrderRoadmapState;
  at?: string;
}

export interface OrderWorkflowView {
  id: string;
  reference: string;
  line_item_count: number;
  outstanding_quantity: number;
  fulfillment_count: number;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  payment_method: "cod" | "online";
  steps: OrderRoadmapStep[];
  next_action: {
    type: OrderWorkflowAction;
    label: string;
    confirmation: string;
    fulfillment_id?: string;
  } | null;
  exception: { label: string; description: string } | null;
}

function asQuantity(value: number | string | null | undefined) {
  const quantity = Number(value ?? 0);
  return Number.isFinite(quantity) ? quantity : 0;
}

function isoDate(value?: string | Date | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
}

export function formatBusinessOrderReference(
  displayId?: number | string | null,
  fallback = "order_pending",
) {
  const numericId = Number(displayId);
  if (!Number.isInteger(numericId) || numericId < 1) return fallback;
  return `order_${String(numericId).padStart(2, "0")}`;
}

export function getOutstandingFulfillmentItems(order: OrderWorkflowRecord) {
  return (order.items ?? []).flatMap((item) => {
    const remaining = Math.max(
      0,
      asQuantity(item.quantity) - asQuantity(item.detail?.fulfilled_quantity),
    );
    return remaining > 0 ? [{ id: item.id, quantity: remaining }] : [];
  });
}

export function getShipmentItems(fulfillment: OrderWorkflowFulfillment) {
  const quantitiesByLineItem = new Map<string, number>();
  for (const item of fulfillment.items ?? []) {
    const quantity = asQuantity(item.quantity);
    if (!item.line_item_id || quantity <= 0) continue;
    quantitiesByLineItem.set(
      item.line_item_id,
      Math.max(quantitiesByLineItem.get(item.line_item_id) ?? 0, quantity),
    );
  }
  return [...quantitiesByLineItem].map(([id, quantity]) => ({ id, quantity }));
}

export function buildOrderWorkflowView(order: OrderWorkflowRecord): OrderWorkflowView {
  const paymentStatus = order.payment_status ?? "not_paid";
  const fulfillmentStatus = order.fulfillment_status ?? "not_fulfilled";
  const providerIds = (order.payment_collections ?? []).flatMap((collection) =>
    (collection.payments ?? []).flatMap((payment) =>
      payment.provider_id ? [payment.provider_id] : [],
    ),
  );
  const isCod = providerIds.includes("pp_system_default");
  const paymentReady =
    isCod || ["authorized", "partially_captured", "captured", "partially_refunded"].includes(paymentStatus);
  const activeFulfillments = (order.fulfillments ?? []).filter(
    (fulfillment) => !fulfillment.canceled_at,
  );
  const unshippedFulfillment = activeFulfillments.find(
    (fulfillment) => !fulfillment.shipped_at,
  );
  const undeliveredFulfillment = activeFulfillments.find(
    (fulfillment) => fulfillment.shipped_at && !fulfillment.delivered_at,
  );
  const hasFulfillment = activeFulfillments.length > 0;
  const outstandingItems = getOutstandingFulfillmentItems(order);
  const allFulfilled = hasFulfillment && outstandingItems.length === 0;
  const allShipped =
    allFulfilled && activeFulfillments.every((fulfillment) => Boolean(fulfillment.shipped_at));
  const allDelivered =
    allFulfilled && activeFulfillments.every((fulfillment) => Boolean(fulfillment.delivered_at));
  const canceled = Boolean(order.canceled_at) || order.status === "canceled";
  const returned = ["returned", "partially_returned"].includes(fulfillmentStatus);

  let nextAction: OrderWorkflowView["next_action"] = null;
  if (!canceled && !returned && paymentReady) {
    if (unshippedFulfillment) {
      nextAction = {
        type: "ship",
        label: "Mark as shipped",
        confirmation:
          "Confirm that the packed items have been handed to the approved carrier. This updates inventory and customer-facing fulfillment history.",
        fulfillment_id: unshippedFulfillment.id,
      };
    } else if (undeliveredFulfillment) {
      nextAction = {
        type: "deliver",
        label: "Mark as delivered",
        confirmation:
          "Confirm delivery only after carrier or recipient evidence is available. This records the fulfillment as delivered.",
        fulfillment_id: undeliveredFulfillment.id,
      };
    } else if (outstandingItems.length) {
      nextAction = {
        type: "fulfill",
        label: "Create fulfillment",
        confirmation:
          "Confirm that payment or Cash on Delivery approval, inventory, packing instructions, and the delivery address have been reviewed.",
      };
    }
  }

  const exception = canceled
    ? {
        label: "Order canceled",
        description: "Fulfillment actions are locked. Review payment reversal and released inventory.",
      }
    : returned
      ? {
          label: fulfillmentStatus === "returned" ? "Order returned" : "Partial return",
          description:
            "Use Medusa's return and refund workflows so received quantities, payment history, and inventory remain reconciled.",
        }
      : !paymentReady
        ? {
            label: "Payment review required",
            description:
              "Do not fulfill an online-payment order until the backend records an authorized or captured payment.",
          }
        : null;

  const normalState = (complete: boolean, current: boolean): OrderRoadmapState =>
    canceled || returned ? "exception" : complete ? "complete" : current ? "current" : "pending";

  const paymentDescription = isCod
    ? "Cash on Delivery approved; collect and reconcile with delivery evidence."
    : paymentReady
      ? `Online payment ${paymentStatus.replaceAll("_", " ")}.`
      : "Waiting for verified online payment authorization or capture.";

  return {
    id: order.id,
    reference: formatBusinessOrderReference(order.display_id, order.id),
    line_item_count: (order.items ?? []).length,
    outstanding_quantity: outstandingItems.reduce((total, item) => total + item.quantity, 0),
    fulfillment_count: activeFulfillments.length,
    status: order.status,
    payment_status: paymentStatus,
    fulfillment_status: fulfillmentStatus,
    payment_method: isCod ? "cod" : "online",
    steps: [
      {
        key: "placed",
        label: "Order placed",
        description: "Customer, address, items, price, and inventory reservation recorded.",
        state: canceled || returned ? "exception" : "complete",
        at: isoDate(order.created_at),
      },
      {
        key: "payment",
        label: isCod ? "COD approved" : "Payment verified",
        description: paymentDescription,
        state: normalState(paymentReady, !paymentReady),
      },
      {
        key: "fulfilled",
        label: "Packed / fulfilled",
        description: "Items allocated from the primary warehouse and prepared for dispatch.",
        state: normalState(allFulfilled, paymentReady && !allFulfilled),
        at: isoDate(activeFulfillments.find((fulfillment) => fulfillment.packed_at)?.packed_at),
      },
      {
        key: "shipped",
        label: "Shipped",
        description: "Order handed to the carrier; tracking belongs on the shipment record.",
        state: normalState(allShipped, hasFulfillment && !allShipped),
        at: isoDate(activeFulfillments.find((fulfillment) => fulfillment.shipped_at)?.shipped_at),
      },
      {
        key: "delivered",
        label: "Delivered",
        description: "Carrier or recipient delivery confirmation recorded.",
        state: normalState(allDelivered, allShipped && !allDelivered),
        at: isoDate(
          activeFulfillments.find((fulfillment) => fulfillment.delivered_at)?.delivered_at,
        ),
      },
    ],
    next_action: nextAction,
    exception,
  };
}
