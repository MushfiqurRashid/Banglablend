"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { buildOrderWorkflowView, formatBusinessOrderReference } from "@/lib/order-workflow";

async function requireOrderManager() {
  const session = await getStaffSession();
  if (!session) throw new Error("Your admin session is no longer active. Sign in to the admin panel again.");
  if (!hasPermission(session, "orders", "manage")) throw new Error("You do not have permission to manage orders.");
  return session;
}

async function loadOrderWorkflow(supabase: SupabaseClient, orderId: string) {
  const [{ data: order, error: orderError }, { data: items, error: itemsError }, { data: fulfillments, error: fulfillmentsError }, { data: paymentCollections, error: paymentsError }] =
    await Promise.all([
      supabase.from("orders").select("id, display_id, status, payment_status, canceled_at, created_at").eq("id", orderId).maybeSingle(),
      supabase.from("order_line_items").select("id, variant_id, quantity, fulfilled_quantity, shipped_quantity, delivered_quantity").eq("order_id", orderId),
      supabase.from("fulfillments").select("id, packed_at, shipped_at, delivered_at, canceled_at").eq("order_id", orderId),
      supabase.from("payment_collections").select("payment_sessions ( provider )").eq("order_id", orderId),
    ]);
  const error = orderError ?? itemsError ?? fulfillmentsError ?? paymentsError;
  if (error) throw new Error(error.message);
  if (!order) throw new Error("This order no longer exists.");

  const isCod = (paymentCollections ?? []).some((collection) => {
    const sessions = Array.isArray(collection.payment_sessions) ? collection.payment_sessions : [collection.payment_sessions];
    return sessions.some((paymentSession) => paymentSession?.provider === "cod");
  });
  const view = buildOrderWorkflowView({
    id: order.id,
    display_id: order.display_id,
    status: order.status,
    payment_status: order.payment_status,
    canceled_at: order.canceled_at,
    created_at: order.created_at,
    items: (items ?? []).map((item) => ({ id: item.id, quantity: item.quantity, fulfilled_quantity: item.fulfilled_quantity })),
    fulfillments: fulfillments ?? [],
    is_cod: isCod,
  });
  return { order, items: items ?? [], fulfillments: fulfillments ?? [], view };
}

function refreshOrder(orderId: string) {
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/");
}

export async function fulfillOrderAction(orderId: string, _displayId: number) {
  const session = await requireOrderManager();
  const supabase = await getSupabaseForRequest();
  const context = await loadOrderWorkflow(supabase, orderId);
  if (context.view.nextAction?.type !== "fulfill") throw new Error("This order is not ready for fulfillment. Refresh the page and review its payment state.");

  const outstanding = context.items.filter((item) => item.fulfilled_quantity < item.quantity);
  const { data: primaryLocation, error: locationError } = await supabase.from("stock_locations").select("id").eq("is_primary", true).maybeSingle();
  if (locationError) throw new Error(locationError.message);
  if (!primaryLocation) throw new Error("Configure a primary stock location before creating fulfillment.");

  const { data: fulfillment, error } = await supabase
    .from("fulfillments")
    .insert({ order_id: orderId, location_id: primaryLocation.id, status: "not_shipped", packed_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error || !fulfillment) throw new Error(error?.message ?? "Could not create fulfillment.");

  const { error: fulfillmentItemError } = await supabase
    .from("fulfillment_items")
    .insert(outstanding.map((item) => ({ fulfillment_id: fulfillment.id, line_item_id: item.id, quantity: item.quantity - item.fulfilled_quantity })));
  if (fulfillmentItemError) {
    await supabase.from("fulfillments").delete().eq("id", fulfillment.id);
    throw new Error(fulfillmentItemError.message);
  }

  for (const item of outstanding) {
    const { error: itemError } = await supabase.from("order_line_items").update({ fulfilled_quantity: item.quantity }).eq("id", item.id);
    if (itemError) throw new Error(itemError.message);
  }
  const { error: orderError } = await supabase.from("orders").update({ fulfillment_status: "fulfilled" }).eq("id", orderId);
  if (orderError) throw new Error(orderError.message);

  const reference = formatBusinessOrderReference(context.order.display_id);
  await recordAudit(supabase, session, {
    action: "order.workflow.fulfill",
    resourceType: "order",
    resourceId: orderId,
    resourceLabel: reference,
    summary: `Fulfillment created for ${reference}.`,
    after: { fulfillment_id: fulfillment.id, item_count: outstanding.length },
  });
  refreshOrder(orderId);
}

export async function shipOrderAction(orderId: string, fulfillmentId: string, _displayId: number) {
  const session = await requireOrderManager();
  const supabase = await getSupabaseForRequest();
  const context = await loadOrderWorkflow(supabase, orderId);
  if (context.view.nextAction?.type !== "ship" || context.view.nextAction.fulfillmentId !== fulfillmentId) {
    throw new Error("This fulfillment is not ready to ship. Refresh the page and review the roadmap.");
  }

  const shippedAt = new Date().toISOString();
  const { data: fulfillment, error } = await supabase
    .from("fulfillments")
    .update({ status: "shipped", shipped_at: shippedAt })
    .eq("id", fulfillmentId)
    .eq("order_id", orderId)
    .is("shipped_at", null)
    .select("id")
    .maybeSingle();
  if (error || !fulfillment) throw new Error(error?.message ?? "The fulfillment could not be marked shipped.");

  const { data: fulfillmentItems, error: itemsError } = await supabase.from("fulfillment_items").select("line_item_id, quantity").eq("fulfillment_id", fulfillmentId);
  if (itemsError) throw new Error(itemsError.message);
  for (const fulfillmentItem of fulfillmentItems ?? []) {
    const lineItem = context.items.find((item) => item.id === fulfillmentItem.line_item_id);
    if (!lineItem) throw new Error("A fulfilled order item is missing.");
    const shippedQuantity = Math.min(lineItem.fulfilled_quantity, lineItem.shipped_quantity + fulfillmentItem.quantity);
    const { error: itemError } = await supabase.from("order_line_items").update({ shipped_quantity: shippedQuantity }).eq("id", lineItem.id);
    if (itemError) throw new Error(itemError.message);
  }
  const allShipped = context.fulfillments.filter((item) => !item.canceled_at).every((item) => item.id === fulfillmentId || Boolean(item.shipped_at));
  const { error: orderError } = await supabase.from("orders").update({ fulfillment_status: allShipped ? "shipped" : "partially_shipped" }).eq("id", orderId);
  if (orderError) throw new Error(orderError.message);

  const reference = formatBusinessOrderReference(context.order.display_id);
  await recordAudit(supabase, session, {
    action: "order.workflow.ship",
    resourceType: "order",
    resourceId: orderId,
    resourceLabel: reference,
    summary: `${reference} marked as shipped.`,
    after: { fulfillment_id: fulfillmentId, shipped_at: shippedAt },
  });
  refreshOrder(orderId);
}

export async function deliverOrderAction(orderId: string, fulfillmentId: string, _displayId: number) {
  const session = await requireOrderManager();
  const supabase = await getSupabaseForRequest();
  const context = await loadOrderWorkflow(supabase, orderId);
  if (context.view.nextAction?.type !== "deliver" || context.view.nextAction.fulfillmentId !== fulfillmentId) {
    throw new Error("This fulfillment is not ready for delivery. Refresh the page and review the roadmap.");
  }

  const deliveredAt = new Date().toISOString();
  const { data: fulfillment, error } = await supabase
    .from("fulfillments")
    .update({ status: "delivered", delivered_at: deliveredAt })
    .eq("id", fulfillmentId)
    .eq("order_id", orderId)
    .not("shipped_at", "is", null)
    .is("delivered_at", null)
    .select("id")
    .maybeSingle();
  if (error || !fulfillment) throw new Error(error?.message ?? "The fulfillment could not be marked delivered.");

  const { data: fulfillmentItems, error: itemsError } = await supabase.from("fulfillment_items").select("line_item_id, quantity").eq("fulfillment_id", fulfillmentId);
  if (itemsError) throw new Error(itemsError.message);
  for (const fulfillmentItem of fulfillmentItems ?? []) {
    const lineItem = context.items.find((item) => item.id === fulfillmentItem.line_item_id);
    if (!lineItem) throw new Error("A shipped order item is missing.");
    const deliveredQuantity = Math.min(lineItem.shipped_quantity, lineItem.delivered_quantity + fulfillmentItem.quantity);
    const { error: itemError } = await supabase.from("order_line_items").update({ delivered_quantity: deliveredQuantity }).eq("id", lineItem.id);
    if (itemError) throw new Error(itemError.message);
  }
  const allDelivered = context.fulfillments.filter((item) => !item.canceled_at).every((item) => item.id === fulfillmentId || Boolean(item.delivered_at));
  const { error: orderError } = await supabase.from("orders").update({ fulfillment_status: allDelivered ? "delivered" : "partially_delivered" }).eq("id", orderId);
  if (orderError) throw new Error(orderError.message);

  const reference = formatBusinessOrderReference(context.order.display_id);
  await recordAudit(supabase, session, {
    action: "order.workflow.deliver",
    resourceType: "order",
    resourceId: orderId,
    resourceLabel: reference,
    summary: `${reference} marked as delivered.`,
    after: { fulfillment_id: fulfillmentId, delivered_at: deliveredAt },
  });
  refreshOrder(orderId);
}
