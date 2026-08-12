import { describe, expect, it } from "vitest";
import { buildOrderWorkflowView, formatBusinessOrderReference, type OrderWorkflowRecord } from "../src/lib/order-workflow";

function order(overrides: Partial<OrderWorkflowRecord> = {}): OrderWorkflowRecord {
  return {
    id: "order-id",
    display_id: 7,
    status: "pending",
    payment_status: "not_paid",
    canceled_at: null,
    created_at: "2026-08-10T00:00:00.000Z",
    items: [{ id: "line-1", quantity: 2, fulfilled_quantity: 0 }],
    fulfillments: [],
    is_cod: false,
    ...overrides,
  };
}

describe("order operations roadmap", () => {
  it("uses the stable business reference", () => {
    expect(formatBusinessOrderReference(7)).toBe("order_07");
  });

  it("blocks online fulfillment until payment is verified", () => {
    const view = buildOrderWorkflowView(order());
    expect(view.nextAction).toBeNull();
    expect(view.exception?.label).toBe("Payment review required");
  });

  it("allows COD orders to begin fulfillment", () => {
    expect(buildOrderWorkflowView(order({ is_cod: true })).nextAction?.type).toBe("fulfill");
  });

  it("advances only from packed to shipped to delivered", () => {
    const packed = order({
      payment_status: "captured",
      items: [{ id: "line-1", quantity: 2, fulfilled_quantity: 2 }],
      fulfillments: [{ id: "fulfillment-1", packed_at: "2026-08-10T01:00:00.000Z", shipped_at: null, delivered_at: null, canceled_at: null }],
    });
    expect(buildOrderWorkflowView(packed).nextAction?.type).toBe("ship");
    const shipped = { ...packed, fulfillments: [{ ...packed.fulfillments[0]!, shipped_at: "2026-08-10T02:00:00.000Z" }] };
    expect(buildOrderWorkflowView(shipped).nextAction?.type).toBe("deliver");
  });
});
