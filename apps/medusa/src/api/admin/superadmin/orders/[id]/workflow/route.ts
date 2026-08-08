import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { QueryGraphFunction } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  createOrderFulfillmentWorkflow,
  createOrderShipmentWorkflow,
  getOrderDetailWorkflow,
  markOrderFulfillmentAsDeliveredWorkflow,
} from "@medusajs/medusa/core-flows";
import { recordAdminAudit } from "../../../../../../lib/admin/audit";
import {
  buildOrderWorkflowView,
  getOutstandingFulfillmentItems,
  getShipmentItems,
  type OrderWorkflowRecord,
} from "../../../../../../lib/admin/order-workflow";

const orderIdSchema = z.string().regex(/^order_[A-Za-z0-9]+$/);
const actionSchema = z
  .object({
    action: z.enum(["fulfill", "ship", "deliver"]),
    notify_customer: z.boolean().default(true),
  })
  .strict();

const orderWorkflowFields = [
  "id",
  "display_id",
  "custom_display_id",
  "status",
  "created_at",
  "canceled_at",
  "items.*",
  "items.detail.*",
  "fulfillments.*",
  "fulfillments.items.*",
  "payment_collections.*",
  "payment_collections.payments.*",
  "shipping_methods.*",
];

type WorkflowOrderRecord = OrderWorkflowRecord & {
  shipping_methods?: Array<{ shipping_option_id?: string | null }>;
};

async function loadOrder(scope: AuthenticatedMedusaRequest["scope"], orderId: string) {
  const { result } = await getOrderDetailWorkflow(scope).run({
    input: {
      order_id: orderId,
      fields: orderWorkflowFields,
    },
  });
  return result as WorkflowOrderRecord;
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsedId = orderIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid order ID." });

  const order = await loadOrder(req.scope, parsedId.data);

  return res.json({ workflow: buildOrderWorkflowView(order) });
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsedId = orderIdSchema.safeParse(req.params.id);
  const parsedAction = actionSchema.safeParse(req.body);
  if (!parsedId.success || !parsedAction.success) {
    return res.status(400).json({ message: "Choose a valid order workflow action." });
  }

  const query = req.scope.resolve<{ graph: QueryGraphFunction }>(
    ContainerRegistrationKeys.QUERY,
  );
  const beforeOrder = await loadOrder(req.scope, parsedId.data);

  const before = buildOrderWorkflowView(beforeOrder);
  if (before.next_action?.type !== parsedAction.data.action) {
    return res.status(409).json({
      message: before.exception?.description ?? "Complete the current order step before continuing.",
      workflow: before,
    });
  }

  const noNotification = !parsedAction.data.notify_customer;
  if (parsedAction.data.action === "fulfill") {
    const items = getOutstandingFulfillmentItems(beforeOrder);
    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["id", "default_location_id"],
    });
    const locationId = stores[0]?.default_location_id;
    if (!locationId) {
      return res.status(409).json({
        message: "Set the store's primary stock location before creating fulfillment.",
      });
    }
    if (!items.length) {
      return res.status(409).json({ message: "This order has no outstanding items to fulfill." });
    }
    const shippingOptionId = beforeOrder.shipping_methods?.[0]?.shipping_option_id;
    await createOrderFulfillmentWorkflow(req.scope).run({
      input: {
        order_id: beforeOrder.id,
        items,
        location_id: locationId,
        ...(shippingOptionId ? { shipping_option_id: shippingOptionId } : {}),
        no_notification: noNotification,
      },
    });
  }

  if (parsedAction.data.action === "ship") {
    const fulfillment = (beforeOrder.fulfillments ?? []).find(
      (entry) =>
        entry.id === before.next_action?.fulfillment_id &&
        !entry.canceled_at &&
        !entry.shipped_at,
    );
    const items = fulfillment ? getShipmentItems(fulfillment) : [];
    if (!fulfillment || !items.length) {
      return res.status(409).json({ message: "No packed fulfillment is ready to ship." });
    }
    await createOrderShipmentWorkflow(req.scope).run({
      input: {
        order_id: beforeOrder.id,
        fulfillment_id: fulfillment.id,
        items,
        labels: [],
        no_notification: noNotification,
        created_by: req.auth_context.actor_id,
      },
    });
  }

  if (parsedAction.data.action === "deliver") {
    const fulfillment = (beforeOrder.fulfillments ?? []).find(
      (entry) =>
        entry.id === before.next_action?.fulfillment_id &&
        entry.shipped_at &&
        !entry.delivered_at &&
        !entry.canceled_at,
    );
    if (!fulfillment) {
      return res.status(409).json({ message: "No shipped fulfillment is ready for delivery." });
    }
    await markOrderFulfillmentAsDeliveredWorkflow(req.scope).run({
      input: {
        orderId: beforeOrder.id,
        fulfillmentId: fulfillment.id,
        no_notification: noNotification,
      },
    });
  }

  const afterOrder = await loadOrder(req.scope, beforeOrder.id);
  const after = buildOrderWorkflowView(afterOrder);

  await recordAdminAudit(req, {
    action: `order.workflow.${parsedAction.data.action}`,
    resourceType: "order",
    resourceId: beforeOrder.id,
    resourceLabel: before.reference,
    summary: `${parsedAction.data.action} recorded for ${before.reference}.`,
    before: {
      status: before.status,
      payment_status: before.payment_status,
      fulfillment_status: before.fulfillment_status,
      next_action: before.next_action?.type,
    },
    after: {
      status: after.status,
      payment_status: after.payment_status,
      fulfillment_status: after.fulfillment_status,
      next_action: after.next_action?.type,
    },
    metadata: { notify_customer: parsedAction.data.notify_customer },
  });

  return res.json({ workflow: after });
}
