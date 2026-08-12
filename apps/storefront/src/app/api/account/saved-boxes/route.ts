import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseForRequest } from "@/lib/auth/server";

// Not z.uuid(): migrated products use md5(...)::uuid ids -- see the note in ../wishlist/route.ts.
const uuidLike = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const mutationSchema = z.object({ catalogId: uuidLike, productIds: z.array(uuidLike).min(1) });

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
  if (!parsed.success) return NextResponse.json({ error: "Choose products for this box." }, { status: 400 });

  const auth = await requireCustomer();
  if (!auth) return NextResponse.json({ error: "Sign in to save a box for later." }, { status: 401 });

  const { data: catalog } = await auth.supabase.from("storefront_catalogs").select("id, name, box_size, experience").eq("id", parsed.data.catalogId).maybeSingle();
  if (!catalog || catalog.experience !== "build_a_box") return NextResponse.json({ error: "This catalog does not support saved boxes." }, { status: 400 });
  if (parsed.data.productIds.length !== catalog.box_size) {
    return NextResponse.json({ error: `Choose exactly ${catalog.box_size} products for this box.` }, { status: 400 });
  }

  const { data: box, error: boxError } = await auth.supabase
    .from("saved_boxes")
    .insert({ customer_id: auth.customerId, catalog_id: catalog.id, name: catalog.name })
    .select("id")
    .single();
  if (boxError || !box) return NextResponse.json({ error: "The box could not be saved." }, { status: 400 });

  const { error: itemsError } = await auth.supabase
    .from("saved_box_items")
    .insert(parsed.data.productIds.map((productId, index) => ({ saved_box_id: box.id, product_id: productId, sort_order: index })));
  if (itemsError) return NextResponse.json({ error: "The box items could not be saved." }, { status: 400 });

  return NextResponse.json({ id: box.id }, { status: 201 });
}
