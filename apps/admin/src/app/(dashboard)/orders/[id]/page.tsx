import { notFound } from "next/navigation";
import { Download, FileCheck2 } from "lucide-react";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { canDownloadInvoice } from "@/lib/invoice";
import { buildOrderWorkflowView, formatBusinessOrderReference } from "@/lib/order-workflow";
import { RoadmapActions } from "./roadmap-actions";

const stateColor: Record<string, string> = {
  complete: "badge-success",
  current: "badge-warning",
  pending: "badge-neutral",
  exception: "badge-danger",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getStaffSession();
  const canManage = hasPermission(session, "orders", "manage");
  const supabase = await getSupabaseForRequest();

  const [{ data: order }, { data: lineItems }, { data: fulfillments }, { data: addresses }, { data: gift }, { data: paymentCollections }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_line_items").select("*").eq("order_id", id),
    supabase.from("fulfillments").select("*").eq("order_id", id),
    supabase.from("order_addresses").select("*").eq("order_id", id),
    supabase.from("order_gift_details").select("*").eq("order_id", id).maybeSingle(),
    supabase.from("payment_collections").select("id, status, amount, currency_code, payment_sessions ( provider, status )").eq("order_id", id),
  ]);

  if (!order) notFound();

  const metadata = order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata) ? order.metadata : null;
  const isCod = metadata?.payment_method === "cod" || (paymentCollections ?? []).some((collection) => (Array.isArray(collection.payment_sessions) ? collection.payment_sessions : [collection.payment_sessions]).some((s) => s?.provider === "cod"));

  const view = buildOrderWorkflowView({
    id: order.id,
    display_id: order.display_id,
    status: order.status,
    payment_status: order.payment_status,
    canceled_at: order.canceled_at,
    created_at: order.created_at,
    items: (lineItems ?? []).map((item) => ({ id: item.id, quantity: item.quantity, fulfilled_quantity: item.fulfilled_quantity })),
    fulfillments: (fulfillments ?? []).map((f) => ({ id: f.id, packed_at: f.packed_at, shipped_at: f.shipped_at, delivered_at: f.delivered_at, canceled_at: f.canceled_at })),
    is_cod: isCod,
  });

  const shippingAddress = addresses?.find((a) => a.address_type === "shipping");
  const invoiceAvailable = canDownloadInvoice(order, lineItems ?? []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{formatBusinessOrderReference(order.display_id)}</h1>
          <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>{order.email}</p>
        </div>
        {invoiceAvailable ? (
          <a className="btn btn-primary" href={`/api/orders/${order.id}/invoice`} download>
            <Download size={16} /> Download invoice
          </a>
        ) : (
          <span className="badge badge-neutral" title="Every line item must be fulfilled before the invoice is issued.">
            <FileCheck2 size={14} /> Invoice available after fulfillment
          </span>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Order roadmap</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
          {view.steps.map((step) => (
            <div key={step.key} style={{ minWidth: 160 }}>
              <span className={`badge ${stateColor[step.state]}`}>{step.label}</span>
              <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", margin: "0.35rem 0 0" }}>{step.description}</p>
            </div>
          ))}
        </div>
        {view.exception ? (
          <p className="badge badge-danger">{view.exception.label}</p>
        ) : canManage ? (
          <RoadmapActions orderId={order.id} displayId={order.display_id} view={view} />
        ) : (
          <p className="error-text">Your staff role can view this order but cannot manage its fulfillment. Sign in with an Order Operations or Super Admin account.</p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Items</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Fulfilled</th>
                <th>Unit price</th>
              </tr>
            </thead>
            <tbody>
              {lineItems?.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.title}
                    {item.variant_title ? <div style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>{item.variant_title}</div> : null}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{item.fulfilled_quantity}</td>
                  <td>{new Intl.NumberFormat("en-BD", { style: "currency", currency: order.currency_code.toUpperCase() }).format(item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: "0.75rem", fontWeight: 700 }}>
            Total: {new Intl.NumberFormat("en-BD", { style: "currency", currency: order.currency_code.toUpperCase() }).format(order.total)}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {shippingAddress ? (
            <div className="card">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Shipping address</h2>
              <p style={{ fontSize: "0.875rem" }}>
                {shippingAddress.first_name} {shippingAddress.last_name}
                <br />
                {shippingAddress.address_1}
                {shippingAddress.address_2 ? <>, {shippingAddress.address_2}</> : null}
                <br />
                {shippingAddress.city} {shippingAddress.postal_code}
                <br />
                {shippingAddress.phone}
              </p>
            </div>
          ) : null}

          {gift ? (
            <div className="card">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Gift details</h2>
              <p style={{ fontSize: "0.875rem" }}>
                For {gift.recipient_name} ({gift.recipient_telephone})
                {gift.hide_prices ? <><br />Prices hidden</> : null}
                {gift.gift_message ? <><br />&ldquo;{gift.gift_message}&rdquo;</> : null}
                {gift.delivery_instructions ? <><br />{gift.delivery_instructions}</> : null}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
