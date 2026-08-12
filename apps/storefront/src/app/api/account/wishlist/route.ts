import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseForRequest } from "@/lib/auth/server";

// Not z.uuid(): migrated products use md5(...)::uuid ids (see
// supabase/seed/001_migrated_dev_data.sql), which are UUID-shaped but don't satisfy the RFC 9562
// version/variant bits that z.uuid() enforces.
const mutationSchema = z.object({ productId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) });

async function requireCustomer() {
  const supabase = await getSupabaseForRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  return customer ? { supabase, customerId: customer.id } : null;
}

export async function POST(request: Request) {
  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a product to save." }, { status: 400 });

  const auth = await requireCustomer();
  if (!auth) return NextResponse.json({ error: "Sign in to save items to your wishlist." }, { status: 401 });

  const { error } = await auth.supabase
    .from("wishlist_items")
    .upsert({ customer_id: auth.customerId, product_id: parsed.data.productId }, { onConflict: "customer_id,product_id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: "The item could not be saved." }, { status: 400 });
  return NextResponse.json({ saved: true }, { status: 201 });
}
