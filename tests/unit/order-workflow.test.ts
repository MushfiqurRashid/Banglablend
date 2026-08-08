import { describe, expect, it } from "vitest";
import {
  buildOrderWorkflowView,
  formatBusinessOrderReference,
  getShipmentItems,
  type OrderWorkflowRecord,
} from "../../apps/medusa/src/lib/admin/order-workflow";
import { formatOrderReference } from "../../apps/storefront/src/lib/order-reference";

const baseOrder = (overrides: Partial<OrderWorkflowRecord> = {}): OrderWorkflowRecord => ({
  id: "order_01KZB8EFC2NGAMAPT1Y2AX7GBZ",
  display_id: 4,
  status: "pending",
  payment_status: "captured",
  fulfillment_status: "not_fulfilled",
  created_at: "2026-08-06T08:00:00.000Z",
  items: [
    {
      id: "ordli_01KZB8EFC9C8JGYCXGAT2YWWKY",
      quantity: 1,
      detail: { fulfilled_quantity: 0 },
    },
  ],
  fulfillments: [],
  payment_collections: [{ payments: [{ provider_id: "pp_system_default" }] }],
  ...overrides,
});

describe("order operations workflow", () => {
  it("uses the Medusa sequence as a stable order_01-style business reference", () => {
    expect(formatBusinessOrderReference(1)).toBe("order_01");
    expect(formatBusinessOrderReference(4)).toBe("order_04");
    expect(formatBusinessOrderReference(105)).toBe("order_105");
    expect(formatOrderReference(4)).toBe("order_04");
    expect(formatBusinessOrderReference(undefined, "internal_id")).toBe("internal_id");
  });

  it("starts a valid COD order at fulfillment without treating capture as cash collection", () => {
    const workflow = buildOrderWorkflowView(baseOrder());

    expect(workflow.reference).toBe("order_04");
    expect(workflow.payment_method).toBe("cod");
    expect(workflow.steps[1]).toMatchObject({
      key: "payment",
      label: "COD approved",
      state: "complete",
    });
    expect(workflow.steps[1]?.description).toContain("collect and reconcile");
    expect(workflow.next_action?.type).toBe("fulfill");
  });

  it("unlocks shipment after every order item is fulfilled", () => {
    const workflow = buildOrderWorkflowView(
      baseOrder({
        fulfillment_status: "fulfilled",
        items: [
          {
            id: "ordli_01KZB8EFC9C8JGYCXGAT2YWWKY",
            quantity: 1,
            detail: { fulfilled_quantity: 1 },
          },
        ],
        fulfillments: [
          {
            id: "ful_01",
            packed_at: "2026-08-06T09:00:00.000Z",
            items: [
              {
                id: "fulitem_01",
                line_item_id: "ordli_01KZB8EFC9C8JGYCXGAT2YWWKY",
                quantity: 1,
              },
            ],
          },
        ],
      }),
    );

    expect(workflow.steps[2]?.state).toBe("complete");
    expect(workflow.next_action).toMatchObject({ type: "ship", fulfillment_id: "ful_01" });
  });

  it("unlocks delivery only after shipment and ends after delivery", () => {
    const fulfilledItems = [
      {
        id: "ordli_01KZB8EFC9C8JGYCXGAT2YWWKY",
        quantity: 1,
        detail: { fulfilled_quantity: 1 },
      },
    ];
    const shipped = baseOrder({
      fulfillment_status: "shipped",
      items: fulfilledItems,
      fulfillments: [
        {
          id: "ful_01",
          packed_at: "2026-08-06T09:00:00.000Z",
          shipped_at: "2026-08-06T10:00:00.000Z",
          items: [
            {
              id: "fulitem_01",
              line_item_id: "ordli_01KZB8EFC9C8JGYCXGAT2YWWKY",
              quantity: 1,
            },
          ],
        },
      ],
    });

    expect(buildOrderWorkflowView(shipped).next_action?.type).toBe("deliver");

    const delivered = buildOrderWorkflowView({
      ...shipped,
      fulfillment_status: "delivered",
      fulfillments: [
        {
          ...shipped.fulfillments?.[0],
          id: "ful_01",
          delivered_at: "2026-08-06T12:00:00.000Z",
        },
      ],
    });
    expect(delivered.steps[4]?.state).toBe("complete");
    expect(delivered.next_action).toBeNull();
  });

  it("sends original order line-item IDs to Medusa's shipment workflow", () => {
    expect(
      getShipmentItems({
        id: "ful_01",
        items: [
          {
            id: "fulitem_01",
            line_item_id: "ordli_01KZB8EFC9C8JGYCXGAT2YWWKY",
            quantity: 1,
          },
        ],
      }),
    ).toEqual([{ id: "ordli_01KZB8EFC9C8JGYCXGAT2YWWKY", quantity: 1 }]);
  });

  it("blocks online fulfillment before payment and locks canceled orders", () => {
    const unpaid = buildOrderWorkflowView(
      baseOrder({
        payment_status: "not_paid",
        payment_collections: [{ payments: [{ provider_id: "pp_sslcommerz" }] }],
      }),
    );
    expect(unpaid.next_action).toBeNull();
    expect(unpaid.exception?.label).toBe("Payment review required");

    const canceled = buildOrderWorkflowView(
      baseOrder({ status: "canceled", canceled_at: "2026-08-06T09:00:00.000Z" }),
    );
    expect(canceled.next_action).toBeNull();
    expect(canceled.exception?.label).toBe("Order canceled");
  });
});
