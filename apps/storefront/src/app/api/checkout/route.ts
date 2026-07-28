import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { checkoutSchema } from "@bangla-blend/validation";
import { CART_COOKIE } from "@/config/site";
import { getActiveMarket } from "@/lib/commerce/server";
import { getCommerceConfig } from "@/lib/commerce/config";

interface CheckoutCart {
  id: string;
  shipping_methods?: Array<{ id: string }>;
  payment_collection?: { id: string } | null;
}

interface ShippingOption {
  id: string;
  name?: string;
  amount?: number;
  calculated_price?: { calculated_amount?: number; currency_code?: string };
}

async function json<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!response.ok || !payload) throw new Error(payload?.message ?? `Commerce request failed (${response.status}).`);
  return payload;
}

function isDevelopmentPreview() {
  return process.env.NODE_ENV === "development" && process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true";
}

function validGatewayUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return process.env.NODE_ENV === "production" ? url.protocol === "https:" : ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Please check your checkout details.", issues: parsed.error.issues }, { status: 400 });
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return NextResponse.json({ error: "Your cart is empty or expired." }, { status: 409 });
  if (!/^[A-Za-z0-9_-]+$/.test(cartId)) return NextResponse.json({ error: "Your cart is invalid or expired." }, { status: 409 });
  if (process.env.NODE_ENV === "production" && (process.env.PRODUCT_CATALOG_APPROVED !== "true" || process.env.LEGAL_CONTENT_APPROVED !== "true" || process.env.OPERATIONS_RELEASE_APPROVED !== "true")) return NextResponse.json({ error: "Checkout is closed until the production release approvals are recorded." }, { status: 503 });
  const market = await getActiveMarket();
  if (!market.domestic && process.env.ENABLE_INTERNATIONAL_CHECKOUT !== "true") return NextResponse.json({ error: `Checkout is not yet enabled for ${market.label}.` }, { status: 409 });
  if (!market.domestic && parsed.data.paymentMethod !== "international") return NextResponse.json({ error: "Choose a configured international payment method." }, { status: 400 });
  if (market.domestic && parsed.data.paymentMethod === "international") return NextResponse.json({ error: "Choose Cash on Delivery or SSLCOMMERZ for Bangladesh." }, { status: 400 });
  if (parsed.data.shippingAddress.countryCode.toUpperCase() !== market.code.toUpperCase()) return NextResponse.json({ error: `The delivery country must match the selected ${market.label} destination.` }, { status: 409 });
  if (parsed.data.paymentMethod === "cod" && process.env.MEDUSA_COD_ENABLED !== "true") return NextResponse.json({ error: "Cash on Delivery is not currently enabled." }, { status: 409 });
  if (parsed.data.paymentMethod === "sslcommerz" && process.env.SSLCOMMERZ_ENABLED !== "true" && !isDevelopmentPreview()) return NextResponse.json({ error: "SSLCOMMERZ is not currently enabled." }, { status: 409 });
  const config = getCommerceConfig(market.code);
  if (!config.backendUrl || !config.publishableKey) return NextResponse.json({ error: "Commerce is not configured." }, { status: 503 });
  const headers = { "content-type": "application/json", "x-publishable-api-key": config.publishableKey };
  const store = async <T>(path: string, init: RequestInit = {}) => json<T>(await fetch(new URL(path, config.backendUrl), { ...init, cache: "no-store", headers: { ...headers, ...init.headers } }));
  const address = parsed.data.shippingAddress;
  const shippingAddress = { first_name: address.firstName, last_name: address.lastName, address_1: address.address1, address_2: address.address2, city: address.city, province: address.province, postal_code: address.postalCode, country_code: address.countryCode.toLowerCase(), phone: address.phone };
  const billing = parsed.data.billingAddress;
  const billingAddress = parsed.data.billingSameAsShipping || !billing ? shippingAddress : { first_name: billing.firstName, last_name: billing.lastName, address_1: billing.address1, address_2: billing.address2, city: billing.city, province: billing.province, postal_code: billing.postalCode, country_code: billing.countryCode.toLowerCase(), phone: billing.phone };

  try {
    let { cart } = await store<{ cart: CheckoutCart }>(`/store/carts/${encodeURIComponent(cartId)}`, { method: "POST", body: JSON.stringify({ email: parsed.data.email, shipping_address: shippingAddress, billing_address: billingAddress, metadata: { market: market.code, is_gift: parsed.data.isGift, recipient: parsed.data.isGift ? parsed.data.recipient : undefined } }) });
    if (!cart.shipping_methods?.length) {
      const options = await store<{ shipping_options: ShippingOption[] }>(`/store/shipping-options?cart_id=${encodeURIComponent(cartId)}&fields=%2Bcalculated_price`);
      if (options.shipping_options.length > 1 && !parsed.data.shippingOptionId) return NextResponse.json({ error: "Choose a delivery method.", requiresShippingSelection: true, shippingOptions: options.shipping_options.map((option) => ({ id: option.id, name: option.name ?? "Delivery", amount: option.calculated_price?.calculated_amount ?? option.amount, currencyCode: option.calculated_price?.currency_code?.toUpperCase() ?? market.currency })) }, { status: 409 });
      const option = parsed.data.shippingOptionId ? options.shipping_options.find((item) => item.id === parsed.data.shippingOptionId) : options.shipping_options[0];
      if (!option) return NextResponse.json({ error: "No shipping method is configured for this address." }, { status: 409 });
      ({ cart } = await store<{ cart: CheckoutCart }>(`/store/carts/${encodeURIComponent(cartId)}/shipping-methods`, { method: "POST", body: JSON.stringify({ option_id: option.id }) }));
    }

    let paymentCollectionId = cart.payment_collection?.id;
    if (!paymentCollectionId) {
      const collection = await store<{ payment_collection: { id: string } }>("/store/payment-collections", { method: "POST", body: JSON.stringify({ cart_id: cartId }) });
      paymentCollectionId = collection.payment_collection.id;
    }
    const providerId = parsed.data.paymentMethod === "cod" ? (process.env.MEDUSA_COD_PROVIDER_ID ?? "pp_system") : parsed.data.paymentMethod === "sslcommerz" ? (process.env.MEDUSA_SSLCOMMERZ_PROVIDER_ID ?? "pp_sslcommerz_sslcommerz") : process.env.MEDUSA_INTERNATIONAL_PROVIDER_ID;
    if (!providerId) return NextResponse.json({ error: "No payment provider is configured for this market." }, { status: 409 });
    const session = await store<{ payment_collection: { payment_sessions?: Array<{ provider_id: string; data?: Record<string, unknown> }> } }>(`/store/payment-collections/${paymentCollectionId}/payment-sessions`, { method: "POST", body: JSON.stringify({ provider_id: providerId, data: { order_reference: `bb_${cartId}`, customer_email: parsed.data.email, customer_first_name: billingAddress.first_name, customer_last_name: billingAddress.last_name, customer_phone: billingAddress.phone, customer_address: billingAddress.address_1, customer_city: billingAddress.city, customer_country: billingAddress.country_code } }) });
    const activeSession = session.payment_collection.payment_sessions?.find((item) => item.provider_id === providerId);
    const gatewayUrl = activeSession?.data?.gateway_url;
    if (parsed.data.paymentMethod === "sslcommerz" && !validGatewayUrl(gatewayUrl)) return NextResponse.json({ error: "The payment gateway did not return a secure redirect URL." }, { status: 502 });
    const completion = await store<{ type: "order" | "cart"; order?: { id: string }; error?: { message?: string } }>(`/store/carts/${encodeURIComponent(cartId)}/complete`, { method: "POST" });
    if (completion.type !== "order" || !completion.order) return NextResponse.json({ error: completion.error?.message ?? "The cart could not be completed." }, { status: 409 });
    if (parsed.data.paymentMethod === "sslcommerz") {
      return NextResponse.json({ redirect: gatewayUrl, orderId: completion.order.id, paymentStatus: "pending_authorization" });
    }
    const result = NextResponse.json({ redirect: `/checkout/success?order=${encodeURIComponent(completion.order.id)}` });
    result.cookies.delete(CART_COOKIE);
    return result;
  } catch (error) {
    const detail = process.env.NODE_ENV === "development" && error instanceof Error ? ` ${error.message}` : "";
    return NextResponse.json({ error: `Checkout could not be completed.${detail}` }, { status: 503 });
  }
}
