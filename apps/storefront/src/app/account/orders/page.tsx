import Link from "next/link";
import { redirect } from "next/navigation";
import { customerStoreFetch, getCustomerSession } from "@/lib/auth/server";
import { formatOrderReference } from "@/lib/order-reference";

export const metadata = { title: "Orders", robots: { index: false, follow: false } };

interface CustomerOrder {
  id: string;
  display_id?: number;
  created_at: string;
  currency_code: string;
  total: number;
  fulfillment_status?: string;
  payment_status?: string;
}

export default async function OrdersPage() {
  if (!(await getCustomerSession())) redirect("/account/login");

  const payload = await customerStoreFetch<{ orders: CustomerOrder[] }>(
    "/store/orders?limit=50&order=-created_at",
  );
  const orders = payload?.orders ?? [];

  return (
    <>
      <span className="eyebrow">Purchase history</span>
      <h1>Orders &amp; gifts</h1>
      {orders.length ? (
        <div className="account-dashboard" style={{ marginTop: "2rem" }}>
          {orders.map((order) => (
            <Link
              className="account-panel"
              href={`/account/orders/${order.id}`}
              key={order.id}
            >
              <h3>Order {formatOrderReference(order.display_id, order.id)}</h3>
              <p>
                {new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(
                  new Date(order.created_at),
                )}
                {" · "}
                {new Intl.NumberFormat("en-BD", {
                  style: "currency",
                  currency: order.currency_code.toUpperCase(),
                }).format(order.total)}
              </p>
              <p>
                Payment: {order.payment_status ?? "pending"} · Fulfillment:{" "}
                {order.fulfillment_status ?? "not fulfilled"}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: "2rem" }}>
          <h3>No orders to show</h3>
          <p>Your completed Medusa orders and gift history will appear here.</p>
        </div>
      )}
    </>
  );
}
