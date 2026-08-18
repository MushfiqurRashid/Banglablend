import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { checkoutSchema } from "@bangla-blend/validation";
import { createSupabaseServiceRoleClient } from "@bangla-blend/supabase-client";
import { CART_COOKIE } from "@/config/site";
import { getActiveMarket } from "@/lib/commerce/server";
import { getCustomerSession } from "@/lib/auth/server";
import { createSslCommerzSession } from "@/lib/payments/sslcommerz";
import { siteConfig } from "@/config/site";
import { sendTransactionalEmail } from "@/lib/email/server";
import { buildOrderEmails } from "@/lib/email/order-messages";
import { INTERNATIONAL_SHIPPING_OPTION_ID } from "@/config/shipping";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CartRow {
  id: string;
  region_id: string;
  currency_code: string;
  completed_at: string | null;
}

interface ShippingOptionRow {
  id: string;
  name: string;
  amount: number;
  currency_code: string;
}

interface LineItemAmountRow {
  title: string;
  variant_title: string | null;
  quantity: number;
  unit_price: number;
}

interface OrderRow {
  id: string;
  display_id: number;
}

function isDevelopmentPreview() {
  return process.env.NODE_ENV === "development" && process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true";
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your checkout details.", issues: parsed.error.issues }, { status: 400 });
  }
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId || !UUID_RE.test(cartId)) {
    return NextResponse.json({ error: "Your cart is empty or expired." }, { status: 409 });
  }
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.PRODUCT_CATALOG_APPROVED !== "true" ||
      process.env.LEGAL_CONTENT_APPROVED !== "true" ||
      process.env.OPERATIONS_RELEASE_APPROVED !== "true")
  ) {
    return NextResponse.json({ error: "Checkout is closed until the production release approvals are recorded." }, { status: 503 });
  }
  const market = await getActiveMarket();
  const internationalDelivery =
    parsed.data.shippingOptionId === INTERNATIONAL_SHIPPING_OPTION_ID;
  if (!market.domestic && process.env.ENABLE_INTERNATIONAL_CHECKOUT !== "true") {
    return NextResponse.json({ error: `Checkout is not yet enabled for ${market.label}.` }, { status: 409 });
  }
  if (!market.domestic && parsed.data.paymentMethod !== "international") {
    return NextResponse.json({ error: "Choose a configured international payment method." }, { status: 400 });
  }
  if (market.domestic && parsed.data.paymentMethod === "international") {
    return NextResponse.json({ error: "Choose Cash on Delivery or SSLCOMMERZ for Bangladesh." }, { status: 400 });
  }
  if (
    !internationalDelivery &&
    parsed.data.shippingAddress.countryCode.toUpperCase() !== market.code.toUpperCase()
  ) {
    return NextResponse.json({ error: `The delivery country must match the selected ${market.label} destination.` }, { status: 409 });
  }
  if (parsed.data.paymentMethod === "cod" && process.env.COD_ENABLED !== "true") {
    return NextResponse.json({ error: "Cash on Delivery is not currently enabled." }, { status: 409 });
  }
  if (parsed.data.paymentMethod === "sslcommerz" && process.env.SSLCOMMERZ_ENABLED !== "true" && !isDevelopmentPreview()) {
    return NextResponse.json({ error: "SSLCOMMERZ is not currently enabled." }, { status: 409 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: cart } = await supabase.from("carts").select("id, region_id, currency_code, completed_at").eq("id", cartId).returns<CartRow[]>().maybeSingle();
  if (!cart || cart.completed_at) {
    return NextResponse.json({ error: "Your cart is invalid or expired." }, { status: 409 });
  }

  const address = parsed.data.shippingAddress;
  const shippingAddress = {
    address_type: "shipping" as const,
    cart_id: cartId,
    first_name: address.firstName,
    last_name: address.lastName,
    address_1: address.address1,
    address_2: address.address2 ?? null,
    city: address.city,
    province: address.province ?? null,
    postal_code: address.postalCode ?? null,
    country_code: address.countryCode.toLowerCase(),
    phone: address.phone,
  };
  const billing = parsed.data.billingAddress;
  const billingAddress =
    parsed.data.billingSameAsShipping || !billing
      ? { ...shippingAddress, address_type: "billing" as const }
      : {
          address_type: "billing" as const,
          cart_id: cartId,
          first_name: billing.firstName,
          last_name: billing.lastName,
          address_1: billing.address1,
          address_2: billing.address2 ?? null,
          city: billing.city,
          province: billing.province ?? null,
          postal_code: billing.postalCode ?? null,
          country_code: billing.countryCode.toLowerCase(),
          phone: billing.phone,
        };

  try {
    await supabase.from("cart_addresses").delete().eq("cart_id", cartId);
    const { error: addressError } = await supabase.from("cart_addresses").insert([shippingAddress, billingAddress]);
    if (addressError) throw new Error(addressError.message);

    // Link the cart (and thus the order complete_cart() creates from it) to whichever customer
    // is signed in at checkout time, so the order shows up in their account order history.
    // Guest checkouts (no session) leave customer_id null, same as before.
    const customer = await getCustomerSession();

    await supabase
      .from("carts")
      .update({
        customer_id: customer?.id ?? null,
        email: parsed.data.email,
        metadata: {
          market: market.code,
          payment_method: parsed.data.paymentMethod,
          international_delivery: internationalDelivery,
          is_gift: parsed.data.isGift,
          recipient: parsed.data.isGift ? parsed.data.recipient : undefined,
        },
      })
      .eq("id", cartId);

    const { data: shippingOptions } = await supabase
      .from("shipping_options")
      .select("id, name, amount, currency_code")
      .eq("region_id", cart.region_id)
      .eq("is_active", true)
      .order("amount", { ascending: true })
      .returns<ShippingOptionRow[]>();
    const options = shippingOptions ?? [];
    if (!options.length) {
      return NextResponse.json({ error: "No shipping method is configured for this address." }, { status: 409 });
    }
    if (options.length > 1 && !parsed.data.shippingOptionId) {
      return NextResponse.json(
        {
          error: "Choose a delivery method.",
          requiresShippingSelection: true,
          shippingOptions: options.map((option) => ({ id: option.id, name: option.name, amount: option.amount, currencyCode: option.currency_code.toUpperCase() })),
        },
        { status: 409 },
      );
    }
    const option = parsed.data.shippingOptionId ? options.find((item) => item.id === parsed.data.shippingOptionId) : options[0];
    if (!option) return NextResponse.json({ error: "No shipping method is configured for this address." }, { status: 409 });

    await supabase.from("cart_shipping_methods").upsert({ cart_id: cartId, shipping_option_id: option.id, name: option.name, amount: option.amount });

    const { data: lineItems } = await supabase
      .from("cart_line_items")
      .select("title, variant_title, quantity, unit_price")
      .eq("cart_id", cartId)
      .returns<LineItemAmountRow[]>();
    const subtotal = (lineItems ?? []).reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const total = subtotal + option.amount;

    const { data: collection, error: collectionError } = await supabase
      .from("payment_collections")
      .insert({ cart_id: cartId, amount: total, currency_code: cart.currency_code, status: "not_paid" })
      .select("id")
      .returns<{ id: string }[]>()
      .single();
    if (collectionError || !collection) throw new Error(collectionError?.message ?? "Could not create payment collection.");

    const provider = parsed.data.paymentMethod === "sslcommerz" ? "sslcommerz" : "cod";
    let gatewayUrl: string | undefined;
    let sessionData: Record<string, unknown> = {};
    const transactionId = `bb_${cartId}`;

    if (provider === "sslcommerz") {
      const session = await createSslCommerzSession({
        transactionId,
        amount: total,
        currency: cart.currency_code,
        customer: {
          name: `${billingAddress.first_name} ${billingAddress.last_name}`.trim(),
          email: parsed.data.email,
          telephone: billingAddress.phone,
          address: billingAddress.address_1,
          city: billingAddress.city,
          country: billingAddress.country_code,
        },
        successUrl: `${siteConfig.url}/api/payments/sslcommerz/success`,
        failUrl: `${siteConfig.url}/api/payments/sslcommerz/fail`,
        cancelUrl: `${siteConfig.url}/api/payments/sslcommerz/cancel`,
        ipnUrl: `${siteConfig.url}/api/payments/sslcommerz/ipn`,
      }).catch((error: unknown) => {
        throw new Error(error instanceof Error ? error.message : "SSLCOMMERZ session creation failed.");
      });
      gatewayUrl = session.gatewayUrl;
      sessionData = { session_key: session.sessionKey, gateway_url: session.gatewayUrl };
    }

    const { data: session, error: sessionError } = await supabase
      .from("payment_sessions")
      .insert({ payment_collection_id: collection.id, provider, status: provider === "cod" ? "authorized" : "pending", data: { transaction_id: transactionId, ...sessionData } })
      .select("id")
      .returns<{ id: string }[]>()
      .single();
    if (sessionError || !session) throw new Error(sessionError?.message ?? "Could not create payment session.");

    await supabase.from("payments").insert({
      payment_session_id: session.id,
      provider,
      amount: total,
      currency_code: cart.currency_code,
      status: provider === "cod" ? "authorized" : "pending",
      transaction_id: transactionId,
    });

    const { data: order, error: orderError } = await supabase.rpc("complete_cart", { p_cart_id: cartId }).single();
    if (orderError || !order) throw new Error(orderError?.message ?? "The cart could not be completed.");

    const orderRow = order as OrderRow;
    await supabase.from("payment_collections").update({ order_id: orderRow.id, status: provider === "cod" ? "authorized" : "awaiting" }).eq("id", collection.id);
    await supabase.from("orders").update({ payment_status: provider === "cod" ? "authorized" : "awaiting" }).eq("id", orderRow.id);

    const orderReference = `order_${String(orderRow.display_id).padStart(2, "0")}`;
    const currencyCode = cart.currency_code.toUpperCase();
    const paymentMethod =
      provider === "cod"
        ? "Cash on Delivery — payment due at delivery"
        : "SSLCOMMERZ — awaiting gateway confirmation";
    const adminBaseUrl = process.env.NEXT_PUBLIC_ADMIN_URL?.trim().replace(/\/+$/, "");
    const emails = buildOrderEmails({
      orderId: orderRow.id,
      orderReference,
      customerEmail: parsed.data.email,
      customerName: `${shippingAddress.first_name} ${shippingAddress.last_name}`.trim(),
      customerPhone: shippingAddress.phone,
      deliveryAddress: [
        shippingAddress.address_1,
        shippingAddress.address_2,
        [shippingAddress.city, shippingAddress.province, shippingAddress.postal_code].filter(Boolean).join(", "),
        shippingAddress.country_code.toUpperCase(),
      ].filter((line): line is string => Boolean(line)),
      deliveryMethod: option.name,
      paymentMethod,
      currencyCode,
      subtotal,
      shippingTotal: option.amount,
      total,
      lines: (lineItems ?? []).map((line) => ({
        title: line.title,
        variantTitle: line.variant_title,
        quantity: line.quantity,
        unitPrice: line.unit_price,
      })),
      merchantEmail: siteConfig.contactEmail,
      contactEmail: siteConfig.contactEmail,
      ...(adminBaseUrl ? { adminOrderUrl: `${adminBaseUrl}/orders/${orderRow.id}` } : {}),
    });
    const emailResults = await Promise.allSettled([
      sendTransactionalEmail(emails.customer),
      sendTransactionalEmail(emails.merchant),
    ]);
    for (const [index, result] of emailResults.entries()) {
      if (result.status === "rejected") {
        console.error(
          index === 0 ? "Order receipt email failed" : "Merchant order notification email failed",
          result.reason instanceof Error ? result.reason.message : result.reason,
        );
      }
    }

    if (provider === "sslcommerz") {
      if (!gatewayUrl) return NextResponse.json({ error: "The payment gateway did not return a secure redirect URL." }, { status: 502 });
      return NextResponse.json({ redirect: gatewayUrl, orderId: orderRow.id, paymentStatus: "pending_authorization" });
    }
    const result = NextResponse.json({
      redirect: `/checkout/success?order=${encodeURIComponent(orderRow.id)}`,
      orderId: orderRow.id,
      paymentStatus: "cash_on_delivery",
    });
    result.cookies.delete(CART_COOKIE);
    return result;
  } catch (error) {
    const detail = process.env.NODE_ENV === "development" && error instanceof Error ? ` ${error.message}` : "";
    return NextResponse.json({ error: `Checkout could not be completed.${detail}` }, { status: 503 });
  }
}
