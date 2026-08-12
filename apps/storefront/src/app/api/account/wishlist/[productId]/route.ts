import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseForRequest } from "@/lib/auth/server";

// Not z.uuid(): migrated products use md5(...)::uuid ids -- see the note in ../route.ts.
const idSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

async function requireCustomer() {
  const supabase = await getSupabaseForRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  return customer ? { supabase, customerId: customer.id } : null;
}

export async function DELETE(_request: Request, context: { params: Promise<{ productId: string }> }) {
  const idParsed = idSchema.safeParse((await context.params).productId);
  if (!idParsed.success) return NextResponse.json({ error: "Invalid product." }, { status: 400 });

  const auth = await requireCustomer();
  if (!auth) return NextResponse.json({ error: "Sign in to manage your wishlist." }, { status: 401 });

  const { error } = await auth.supabase.from("wishlist_items").delete().eq("product_id", idParsed.data).eq("customer_id", auth.customerId);
  if (error) return NextResponse.json({ error: "The item could not be removed." }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
