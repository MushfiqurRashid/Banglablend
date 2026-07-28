import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { GIFTING_MODULE } from "../../../../modules/gifting";
import type GiftingModuleService from "../../../../modules/gifting/service";
import { z } from "@medusajs/framework/zod";
import { MedusaError } from "@medusajs/framework/utils";
import { recordAdminAudit } from "../../../../lib/admin/audit";

const updateSchema = z.object({
  recipient_name: z.string().trim().min(2).max(120).optional(),
  recipient_telephone: z.string().trim().min(6).max(30).optional(),
  gift_message: z.string().trim().max(500).nullable().optional(),
  hide_prices: z.boolean().optional(),
  packaging_selection: z.string().trim().max(200).nullable().optional(),
  preferred_delivery_date: z.string().datetime().nullable().optional(),
  delivery_instructions: z.string().trim().max(500).nullable().optional(),
  occasion: z.string().trim().max(120).nullable().optional(),
  corporate_order_reference: z.string().trim().max(160).nullable().optional()
}).strict();
const orderIdSchema = z.string().trim().min(1).max(160).regex(/^[A-Za-z0-9_-]+$/);

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsedOrderId = orderIdSchema.safeParse(req.params.orderId);
  if (!parsedOrderId.success) return res.status(400).json({ message: "Invalid order ID." });
  const orderId = parsedOrderId.data;
  const service = req.scope.resolve<GiftingModuleService>(GIFTING_MODULE);
  const [giftOrder] = await service.listGiftOrders({ order_id: orderId });
  return res.json({ gift_order: giftOrder ?? null });
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid gift-order update.", errors: parsed.error.flatten() });
  }
  const service = req.scope.resolve<GiftingModuleService>(GIFTING_MODULE);
  const parsedOrderId = orderIdSchema.safeParse(req.params.orderId);
  if (!parsedOrderId.success) return res.status(400).json({ message: "Invalid order ID." });
  const orderId = parsedOrderId.data;
  const [before] = await service.listGiftOrders({ order_id: orderId });
  if (!before) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Gift order not found.");
  const { preferred_delivery_date: preferredDeliveryDate, ...updates } = parsed.data;
  const giftOrder = await service.updateGiftOrders({
    id: before.id,
    ...updates,
    ...(preferredDeliveryDate !== undefined
      ? { preferred_delivery_date: preferredDeliveryDate === null ? null : new Date(preferredDeliveryDate) }
      : {})
  });
  await recordAdminAudit(req, {
    action: "gift_order.updated",
    resourceType: "gift_order",
    resourceId: giftOrder.id,
    resourceLabel: giftOrder.recipient_name,
    summary: `Updated gift instructions for order ${orderId}.`,
    before,
    after: giftOrder
  });
  return res.json({ gift_order: giftOrder });
}

export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<GiftingModuleService>(GIFTING_MODULE);
  const parsedOrderId = orderIdSchema.safeParse(req.params.orderId);
  if (!parsedOrderId.success) return res.status(400).json({ message: "Invalid order ID." });
  const orderId = parsedOrderId.data;
  const [before] = await service.listGiftOrders({ order_id: orderId });
  if (!before) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Gift order not found.");
  await service.deleteGiftOrders(before.id);
  await recordAdminAudit(req, {
    action: "gift_order.deleted",
    resourceType: "gift_order",
    resourceId: before.id,
    resourceLabel: before.recipient_name,
    summary: `Deleted gift instructions for order ${orderId}.`,
    before
  });
  return res.json({ id: before.id, object: "gift_order", deleted: true });
}
