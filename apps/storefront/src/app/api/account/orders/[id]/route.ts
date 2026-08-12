import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseForRequest } from "@/lib/auth/server";

// Not z.uuid(): migrated orders/products/customers use md5(...)::uuid ids (see
// supabase/seed/002_migrated_customers_and_orders.sql), which are UUID-shaped but don't satisfy
// RFC 9562 version/variant bits that z.uuid() enforces. Same lenient pattern as the existing
// /account/orders/[id] page's UUID_RE.
const idSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const idParsed = idSchema.safeParse((await context.params).id);
  if (!idParsed.success) return NextResponse.json({ error: "Invalid order." }, { status: 400 });

  const supabase = await getSupabaseForRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again to view this order." }, { status: 401 });

  // RLS ("customers read own orders") is the real gate -- a mismatched order id simply returns
  // no row rather than needing a manual customer_id check here, matching the existing
  // /account/orders/[id] page's convention.
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, display_id, email, currency_code, subtotal, shipping_total, tax_total, total, status,
       payment_status, fulfillment_status, is_gift, created_at, canceled_at,
       order_line_items ( id, title, variant_title, thumbnail_url, quantity, unit_price, fulfilled_quantity ),
       order_addresses ( address_type, first_name, last_name, address_1, address_2, city, province, postal_code, country_code, phone ),
       fulfillments ( shipped_at, delivered_at, canceled_at ),
       payment_collections ( payment_sessions ( provider ) )`,
    )
    .eq("id", idParsed.data)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json(order);
}
