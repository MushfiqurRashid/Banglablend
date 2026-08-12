import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Cart, CartLine } from "@bangla-blend/types";
import { createSupabaseServiceRoleClient } from "@bangla-blend/supabase-client";
import { CART_COOKIE } from "@/config/site";
import { getActiveMarket } from "@/lib/commerce/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CartRow {
  id: string;
  currency_code: string;
  completed_at: string | null;
  cart_line_items: Array<{
    id: string;
    variant_id: string;
    title: string;
    variant_title: string | null;
    thumbnail_url: string | null;
    quantity: number;
    unit_price: number;
  }>;
}

const CART_SELECT = "id, currency_code, completed_at, cart_line_items ( id, variant_id, title, variant_title, thumbnail_url, quantity, unit_price )";

function adaptLine(line: CartRow["cart_line_items"][number]): CartLine {
  const total = line.unit_price * line.quantity;
  return {
    id: line.id,
    variantId: line.variant_id,
    title: line.title,
    variantTitle: line.variant_title ?? undefined,
    thumbnail: line.thumbnail_url ?? undefined,
    quantity: line.quantity,
    unitPrice: line.unit_price,
    total,
  };
}

function adaptCart(cart: CartRow): Cart {
  const items = cart.cart_line_items.map(adaptLine);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  return { id: cart.id, currencyCode: cart.currency_code.toUpperCase(), items, subtotal, discountTotal: 0, shippingTotal: 0, total: subtotal };
}

function cartCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" };
}

function errorResponse(error: unknown) {
  const detail = process.env.NODE_ENV === "development" && error instanceof Error ? ` ${error.message}` : "";
  return NextResponse.json({ error: `Cart request failed.${detail}` }, { status: 503 });
}

export async function GET() {
  const store = await cookies();
  const cartId = store.get(CART_COOKIE)?.value;
  if (!cartId || !UUID_RE.test(cartId)) {
    const response = NextResponse.json({ cart: undefined });
    if (cartId) response.cookies.delete(CART_COOKIE);
    return response;
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data: cart } = await supabase.from("carts").select(CART_SELECT).eq("id", cartId).maybeSingle<CartRow>();
  if (!cart || cart.completed_at) {
    const response = NextResponse.json({ cart: undefined });
    response.cookies.delete(CART_COOKIE);
    return response;
  }
  return NextResponse.json({ cart: adaptCart(cart) });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { variantId?: string; quantity?: number };
    if (!body.variantId || !UUID_RE.test(body.variantId) || !Number.isInteger(body.quantity) || (body.quantity ?? 0) < 1 || (body.quantity ?? 0) > 50) {
      return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
    }
    const supabase = createSupabaseServiceRoleClient();
    const store = await cookies();
    let cartId = store.get(CART_COOKIE)?.value;
    let created = false;
    if (!cartId || !UUID_RE.test(cartId)) {
      const market = await getActiveMarket();
      const { data: region, error: regionError } = await supabase.from("regions").select("id, currency_code").eq("market_code", market.code).maybeSingle();
      if (regionError || !region) return NextResponse.json({ error: "This market is not configured." }, { status: 503 });
      const { data: newCart, error: cartError } = await supabase.from("carts").insert({ region_id: region.id, currency_code: region.currency_code }).select("id").single();
      if (cartError || !newCart) throw new Error(cartError?.message ?? "Could not create cart.");
      cartId = newCart.id;
      created = true;
    }
    const { error: rpcError } = await supabase.rpc("cart_add_line_item", { p_cart_id: cartId, p_variant_id: body.variantId, p_quantity: body.quantity });
    if (rpcError) {
      if (rpcError.message.includes("No") && rpcError.message.includes("price is configured")) {
        return NextResponse.json({ error: "This item is not available for the selected market yet." }, { status: 409 });
      }
      throw new Error(rpcError.message);
    }
    const { data: cart } = await supabase.from("carts").select(CART_SELECT).eq("id", cartId).single<CartRow>();
    const response = NextResponse.json({ cart: adaptCart(cart!) });
    if (created) response.cookies.set(CART_COOKIE, cartId!, cartCookieOptions());
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { lineId?: string; quantity?: number };
    const cartId = (await cookies()).get(CART_COOKIE)?.value;
    if (!cartId || !body.lineId || !UUID_RE.test(cartId) || !UUID_RE.test(body.lineId) || !Number.isInteger(body.quantity) || (body.quantity ?? 0) < 1 || (body.quantity ?? 0) > 50) {
      return NextResponse.json({ error: "Invalid cart update." }, { status: 400 });
    }
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.rpc("cart_set_line_item_quantity", { p_cart_id: cartId, p_line_id: body.lineId, p_quantity: body.quantity });
    if (error) throw new Error(error.message);
    const { data: cart } = await supabase.from("carts").select(CART_SELECT).eq("id", cartId).single<CartRow>();
    return NextResponse.json({ cart: adaptCart(cart!) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { lineId?: string };
    const cartId = (await cookies()).get(CART_COOKIE)?.value;
    if (!cartId || !body.lineId || !UUID_RE.test(cartId) || !UUID_RE.test(body.lineId)) {
      return NextResponse.json({ error: "Invalid cart removal." }, { status: 400 });
    }
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.rpc("cart_remove_line_item", { p_cart_id: cartId, p_line_id: body.lineId });
    if (error) throw new Error(error.message);
    const { data: cart } = await supabase.from("carts").select(CART_SELECT).eq("id", cartId).single<CartRow>();
    return NextResponse.json({ cart: adaptCart(cart!) });
  } catch (error) {
    return errorResponse(error);
  }
}
