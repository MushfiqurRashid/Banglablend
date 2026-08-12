"use server";

import { revalidatePath } from "next/cache";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function updateInventoryLevelAction(levelId: string, formData: FormData) {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "catalog", "manage")) throw new Error("Forbidden");

  const stockedQuantity = Number(formData.get("stockedQuantity"));
  const reservedQuantity = Number(formData.get("reservedQuantity"));
  if (!Number.isInteger(stockedQuantity) || stockedQuantity < 0 || !Number.isInteger(reservedQuantity) || reservedQuantity < 0) {
    throw new Error("Stocked and reserved quantities must be non-negative whole numbers.");
  }
  if (reservedQuantity > stockedQuantity) throw new Error("Reserved quantity cannot be greater than stocked quantity.");

  const supabase = await getSupabaseForRequest();
  const { data: level } = await supabase
    .from("inventory_levels")
    .select("stocked_quantity, reserved_quantity, variant:product_variants ( sku, deleted_at, product:products ( deleted_at ) ), location:stock_locations ( name )")
    .eq("id", levelId)
    .maybeSingle();
  if (!level) throw new Error("This inventory record no longer exists.");
  const variant = level && (Array.isArray(level.variant) ? level.variant[0] : level.variant);
  const product = variant && (Array.isArray(variant.product) ? variant.product[0] : variant.product);
  if (!variant || variant.deleted_at || !product || product.deleted_at) {
    throw new Error("Inventory for an archived product cannot be updated.");
  }
  const location = level && (Array.isArray(level.location) ? level.location[0] : level.location);

  const { data: updated, error } = await supabase
    .from("inventory_levels")
    .update({ stocked_quantity: stockedQuantity, reserved_quantity: reservedQuantity })
    .eq("id", levelId)
    .select("id")
    .maybeSingle();
  if (error || !updated) throw new Error(error?.message ?? "The inventory record could not be updated.");

  await recordAudit(supabase, session, {
    action: "catalog.inventory.updated",
    resourceType: "inventory_level",
    resourceId: levelId,
    resourceLabel: variant?.sku ?? undefined,
    summary: `Set stock for ${variant?.sku ?? "variant"} at ${location?.name ?? "location"} to ${stockedQuantity} stocked / ${reservedQuantity} reserved.`,
    before: { stocked_quantity: level.stocked_quantity, reserved_quantity: level.reserved_quantity },
    after: { stocked_quantity: stockedQuantity, reserved_quantity: reservedQuantity },
  });

  revalidatePath("/inventory");
  revalidatePath("/inventory/update");
}
