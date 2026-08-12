import { redirect } from "next/navigation";
import { getCustomerSession, getSupabaseForRequest } from "@/lib/auth/server";
import { formatOrderReference } from "@/lib/order-reference";
import { buildOrderTrackingSteps } from "@/lib/order-tracking";
import { OrderTrackingTimeline } from "@/components/account/order-tracking-timeline";

export const metadata = { title: "Order Tracking", robots: { index: false, follow: false } };

const providerLabels: Record<string, string> = {
  cod: "Cash on Delivery",
  sslcommerz: "SSLCommerz",
  bkash: "bKash",
  nagad: "Nagad",
  wallet: "Wallet",
};

export default async function OrderTrackingPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");

  const supabase = await getSupabaseForRequest();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `id, display_id, created_at, payment_status, status, canceled_at, fulfillment_status,
       order_line_items ( quantity, fulfilled_quantity ),
       fulfillments ( shipped_at, delivered_at, canceled_at ),
       payment_collections ( payment_sessions ( provider ) )`,
    )
    .not("status", "in", "(canceled,archived)")
    .neq("fulfillment_status", "delivered")
    .order("created_at", { ascending: false });

  const activeOrders = orders ?? [];

  return (
    <>
      <span className="eyebrow">Where&apos;s my order</span>
      <h1>Order Tracking</h1>

      {activeOrders.length ? (
        <div className="order-tracking-list" style={{ marginTop: "2rem" }}>
          {activeOrders.map((order) => {
            const provider = order.payment_collections?.[0]?.payment_sessions?.[0]?.provider;
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
              <div className="account-panel order-tracking-card" key={order.id}>
                <div className="order-tracking-card-header">
                  <div>
                    <strong>Order {formatOrderReference(order.display_id, order.id)}</strong>
                    <p className="field-note">
                      Placed {new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(order.created_at))}
                      {provider ? ` · ${providerLabels[provider] ?? provider}` : ""}
                    </p>
                  </div>
                </div>
                <OrderTrackingTimeline steps={steps} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: "2rem" }}>
          <h3>No active orders to track</h3>
          <p>Once you place an order, its live delivery status will show up here.</p>
        </div>
      )}
    </>
  );
}
