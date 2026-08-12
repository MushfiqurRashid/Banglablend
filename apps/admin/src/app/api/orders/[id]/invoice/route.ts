import { NextResponse } from "next/server";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import {
  canDownloadInvoice,
  createInvoicePdf,
  invoiceFilename,
  type InvoiceAddress,
  type InvoiceLineItem,
  type InvoiceOrder,
  type InvoiceSeller,
} from "@/lib/invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SiteSettingsRow {
  brand_name: string;
  support_email: string | null;
  support_phone: string | null;
  address: unknown;
}

function usefulContact(value: string | null) {
  const contact = value?.trim();
  if (!contact || /@example\.(com|org|net)$/i.test(contact) || contact.endsWith(".local")) return null;
  return contact;
}

function sellerFromSettings(settings: SiteSettingsRow | null): InvoiceSeller {
  const address = settings?.address && typeof settings.address === "object" && !Array.isArray(settings.address)
    ? settings.address as Record<string, unknown>
    : {};
  const stringValue = (key: string) => typeof address[key] === "string" ? address[key].trim() : "";
  const location = [stringValue("city"), stringValue("districtOrState"), stringValue("postalCode")].filter(Boolean).join(", ");
  const countryCode = stringValue("countryCode").toUpperCase();
  let country = countryCode;
  if (countryCode) {
    try {
      country = new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode;
    } catch {
      country = countryCode;
    }
  }

  return {
    name: settings?.brand_name?.trim() || "Bangla Blend",
    tagline: "The Taste of Bangladesh",
    addressLines: [stringValue("line1"), stringValue("line2"), location, country].filter(Boolean),
    email: usefulContact(settings?.support_email ?? null),
    phone: usefulContact(settings?.support_phone ?? null),
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(session, "orders", "view")) return NextResponse.json({ error: "You do not have permission to view order invoices." }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid order." }, { status: 400 });
  const supabase = await getSupabaseForRequest();
  const [orderResult, itemsResult, addressesResult, fulfillmentsResult, paymentsResult, siteSettingsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, display_id, email, currency_code, subtotal, shipping_total, tax_total, total, payment_status, fulfillment_status, canceled_at, created_at")
      .eq("id", id)
      .returns<InvoiceOrder[]>()
      .maybeSingle(),
    supabase
      .from("order_line_items")
      .select("title, variant_title, sku, quantity, fulfilled_quantity, unit_price")
      .eq("order_id", id)
      .order("created_at")
      .returns<InvoiceLineItem[]>(),
    supabase
      .from("order_addresses")
      .select("address_type, first_name, last_name, company, address_1, address_2, city, province, postal_code, country_code, phone")
      .eq("order_id", id)
      .returns<Array<InvoiceAddress & { address_type: string }>>(),
    supabase.from("fulfillments").select("packed_at, canceled_at").eq("order_id", id).order("packed_at"),
    supabase.from("payment_collections").select("payment_sessions ( provider )").eq("order_id", id),
    supabase
      .from("site_settings")
      .select("brand_name, support_email, support_phone, address")
      .eq("is_singleton", true)
      .returns<SiteSettingsRow[]>()
      .maybeSingle(),
  ]);

  const queryError = orderResult.error ?? itemsResult.error ?? addressesResult.error ?? fulfillmentsResult.error ?? paymentsResult.error ?? siteSettingsResult.error;
  if (queryError) return NextResponse.json({ error: "Invoice data could not be loaded." }, { status: 500 });
  if (!orderResult.data) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const items = itemsResult.data ?? [];
  if (!canDownloadInvoice(orderResult.data, items)) {
    return NextResponse.json({ error: "The invoice becomes available after every order item is fulfilled." }, { status: 409 });
  }
  const fulfillment = (fulfillmentsResult.data ?? []).find((row) => !row.canceled_at && row.packed_at);
  if (!fulfillment?.packed_at) return NextResponse.json({ error: "The fulfilled order has no packing record." }, { status: 409 });

  const addresses = addressesResult.data ?? [];
  const sessions = (paymentsResult.data ?? []).flatMap((collection) =>
    Array.isArray(collection.payment_sessions) ? collection.payment_sessions : [collection.payment_sessions],
  );
  const provider = sessions.find((paymentSession) => paymentSession?.provider)?.provider ?? "recorded payment";
  const paymentMethod = provider === "cod" ? "Cash on Delivery" : provider === "sslcommerz" ? "SSLCOMMERZ" : provider.replaceAll("_", " ");
  const bytes = await createInvoicePdf({
    order: orderResult.data,
    items,
    seller: sellerFromSettings(siteSettingsResult.data),
    billingAddress: addresses.find((address) => address.address_type === "billing") ?? null,
    shippingAddress: addresses.find((address) => address.address_type === "shipping") ?? null,
    paymentMethod,
    fulfilledAt: fulfillment.packed_at,
  });

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceFilename(orderResult.data.display_id)}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
