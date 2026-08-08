import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Cart, CartLine } from "@bangla-blend/types";
import { CART_COOKIE } from "@/config/site";
import { getActiveMarket } from "@/lib/commerce/server";
import { getCommerceConfig } from "@/lib/commerce/config";

interface MedusaLine {
  id: string;
  variant_id: string;
  title: string;
  variant_title?: string;
  thumbnail?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface MedusaCart {
  id: string;
  currency_code: string;
  region_id?: string;
  completed_at?: string | null;
  items?: MedusaLine[];
  subtotal?: number;
  discount_total?: number;
  shipping_total?: number;
  total?: number;
}

function adaptLine(line: MedusaLine): CartLine {
  return { id: line.id, variantId: line.variant_id, title: line.title, variantTitle: line.variant_title, thumbnail: line.thumbnail, quantity: line.quantity, unitPrice: line.unit_price, total: line.total };
}

function adaptCart(cart: MedusaCart): Cart {
  return { id: cart.id, currencyCode: cart.currency_code, items: (cart.items ?? []).map(adaptLine), subtotal: cart.subtotal ?? 0, discountTotal: cart.discount_total ?? 0, shippingTotal: cart.shipping_total ?? 0, total: cart.total ?? 0 };
}

async function storeRequest<T = { cart: MedusaCart }>(path: string, init: RequestInit = {}) {
  const market = await getActiveMarket();
  const config = getCommerceConfig(market.code);
  if (!config.backendUrl || !config.publishableKey) throw new Error("Commerce is not configured. Start Medusa and add a publishable key.");
  const target = new URL(path, config.backendUrl);
  if (target.origin !== new URL(config.backendUrl).origin || !target.pathname.startsWith("/store/")) throw new Error("Commerce request target was rejected.");
  const response = await fetch(target, {
    ...init,
    cache: "no-store",
    headers: { "content-type": "application/json", "x-publishable-api-key": config.publishableKey, ...init.headers }
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Commerce request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

function cartResponse(cart: MedusaCart, setCookie = false) {
  const response = NextResponse.json({ cart: adaptCart(cart) });
  if (setCookie) response.cookies.set(CART_COOKIE, cart.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return response;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("is not associated with any stock location for variant")) {
    return NextResponse.json(
      { error: "This item is not stocked for online orders yet. Please choose another item or try again later." },
      { status: 409 },
    );
  }
  const detail = process.env.NODE_ENV === "development" && error instanceof Error ? ` ${error.message}` : "";
  return NextResponse.json({ error: `Cart request failed.${detail}` }, { status: 503 });
}

export async function GET() {
  const store = await cookies();
  const cartId = store.get(CART_COOKIE)?.value;
  if (!cartId) return NextResponse.json({ cart: undefined });
  if (!/^[A-Za-z0-9_-]+$/.test(cartId)) {
    const response = NextResponse.json({ cart: undefined });
    response.cookies.delete(CART_COOKIE);
    return response;
  }
  try {
    const { cart } = await storeRequest(`/store/carts/${encodeURIComponent(cartId)}?fields=%2Bitems.variant.product`);
    if (cart.completed_at) {
      const response = NextResponse.json({ cart: undefined });
      response.cookies.delete(CART_COOKIE);
      return response;
    }
    return cartResponse(cart);
  } catch (error) {
    const response = errorResponse(error);
    response.cookies.delete(CART_COOKIE);
    return response;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { variantId?: string; quantity?: number };
    if (!body.variantId || !Number.isInteger(body.quantity) || (body.quantity ?? 0) < 1 || (body.quantity ?? 0) > 50) return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
    const store = await cookies();
    let cartId = store.get(CART_COOKIE)?.value;
    let created = false;
    if (!cartId) {
      const market = await getActiveMarket();
      const config = getCommerceConfig(market.code);
      const payload = await storeRequest("/store/carts", { method: "POST", body: JSON.stringify(config.regionId ? { region_id: config.regionId } : {}) });
      cartId = payload.cart.id;
      created = true;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(cartId) || !/^[A-Za-z0-9_-]+$/.test(body.variantId)) return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
    const { cart } = await storeRequest(`/store/carts/${encodeURIComponent(cartId)}/line-items`, { method: "POST", body: JSON.stringify({ variant_id: body.variantId, quantity: body.quantity }) });
    return cartResponse(cart, created);
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { lineId?: string; quantity?: number };
    const cartId = (await cookies()).get(CART_COOKIE)?.value;
    if (!cartId || !body.lineId || !/^[A-Za-z0-9_-]+$/.test(cartId) || !/^[A-Za-z0-9_-]+$/.test(body.lineId) || !Number.isInteger(body.quantity) || (body.quantity ?? 0) < 1 || (body.quantity ?? 0) > 50) return NextResponse.json({ error: "Invalid cart update." }, { status: 400 });
    const { cart } = await storeRequest(`/store/carts/${encodeURIComponent(cartId)}/line-items/${encodeURIComponent(body.lineId)}`, { method: "POST", body: JSON.stringify({ quantity: body.quantity }) });
    return cartResponse(cart);
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { lineId?: string };
    const cartId = (await cookies()).get(CART_COOKIE)?.value;
    if (!cartId || !body.lineId || !/^[A-Za-z0-9_-]+$/.test(cartId) || !/^[A-Za-z0-9_-]+$/.test(body.lineId)) return NextResponse.json({ error: "Invalid cart removal." }, { status: 400 });
    const { parent } = await storeRequest<{ parent: MedusaCart }>(`/store/carts/${encodeURIComponent(cartId)}/line-items/${encodeURIComponent(body.lineId)}`, { method: "DELETE" });
    return cartResponse(parent);
  } catch (error) { return errorResponse(error); }
}
