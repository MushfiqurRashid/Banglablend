import { notFound, redirect } from "next/navigation";
import { formatMoney } from "@bangla-blend/commerce-client";
import { getCustomerSession, getSupabaseForRequest } from "@/lib/auth/server";
import { formatOrderReference } from "@/lib/order-reference";
import { buildOrderTrackingSteps } from "@/lib/order-tracking";
import { OrderTrackingTimeline } from "@/components/account/order-tracking-timeline";

export const metadata = { title: "Order Detail", robots: { index: false, follow: false } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const providerLabels: Record<string, string> = {
  cod: "Cash on Delivery",
  sslcommerz: "SSLCommerz",
  bkash: "bKash",
  nagad: "Nagad",
  wallet: "Wallet",
};

export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await getSupabaseForRequest();
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, display_id, currency_code, subtotal, shipping_total, tax_total, total, status, payment_status, fulfillment_status, is_gift, created_at, canceled_at,
       order_line_items ( id, title, variant_title, quantity, unit_price, fulfilled_quantity ),
       order_addresses ( address_type, first_name, last_name, address_1, address_2, city, province, postal_code, country_code, phone ),
       fulfillments ( shipped_at, delivered_at, canceled_at ),
       payment_collections ( payment_sessions ( provider ) )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const shipping = order.order_addresses?.find((address) => address.address_type === "shipping");
  const provider = order.payment_collections?.[0]?.payment_sessions?.[0]?.provider;
  const paymentLabel = provider ? (providerLabels[provider] ?? provider) : "—";
  const steps = buildOrderTrackingSteps({
    created_at: order.created_at,
    payment_status: order.payment_status,
    is_cod: provider === "cod",
    canceled_at: order.canceled_at,
    status: order.status,
    items: (order.order_line_items ?? []).map((item) => ({ quantity: item.quantity, fulfilled_quantity: item.fulfilled_quantity })),
    fulfillments: order.fulfillments ?? [],
  });

  return (
    <>
      <span className="eyebrow">Order detail</span>
      <h1>Order {formatOrderReference(order.display_id, order.id)}</h1>

      <div className="order-modal-grid" style={{ marginTop: "2rem" }}>
        <section className="account-panel">
          <h3>Delivery Address</h3>
          {shipping ? (
            <p>
              {shipping.first_name} {shipping.last_name}
              <br />
              {shipping.address_1}
              {shipping.address_2 ? `, ${shipping.address_2}` : ""}
              <br />
              {shipping.city}
              {shipping.province ? `, ${shipping.province}` : ""}
              <br />
              {shipping.postal_code ? `${shipping.postal_code} ` : ""}
              {shipping.country_code.toUpperCase()}
            </p>
          ) : (
            <p>—</p>
          )}
        </section>
        <section className="account-panel">
          <h3>Order Summary</h3>
          <div className="order-summary-row"><span>Subtotal</span><span>{formatMoney(order.subtotal, order.currency_code.toUpperCase())}</span></div>
          <div className="order-summary-row"><span>Delivery Charge</span><span>{formatMoney(order.shipping_total, order.currency_code.toUpperCase())}</span></div>
          {order.tax_total > 0 ? (
            <div className="order-summary-row"><span>Tax</span><span>{formatMoney(order.tax_total, order.currency_code.toUpperCase())}</span></div>
          ) : null}
          <div className="order-summary-row order-summary-total"><span>Total</span><span>{formatMoney(order.total, order.currency_code.toUpperCase())}</span></div>
          <div className="order-summary-row"><span>Payment Method</span><span>{paymentLabel}</span></div>
        </section>
      </div>

      <div className="order-modal-grid order-modal-grid-2" style={{ marginTop: "1.5rem" }}>
        <section className="account-panel">
          <h3>Items Ordered</h3>
          <table className="order-items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {order.order_line_items?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    {item.variant_title ? <span className="field-note"> {item.variant_title}</span> : null}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unit_price, order.currency_code.toUpperCase())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="account-panel">
          <h3>Order Status</h3>
          <OrderTrackingTimeline steps={steps} />
        </section>
      </div>

      {order.is_gift ? <p style={{ marginTop: "1.5rem" }}>This order contains instructions for the gift recipient. Support can help with approved changes.</p> : null}
    </>
  );
}
