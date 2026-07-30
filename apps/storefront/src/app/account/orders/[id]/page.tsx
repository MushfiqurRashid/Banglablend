import { notFound, redirect } from "next/navigation";
import { customerStoreFetch, getCustomerSession } from "@/lib/auth/server";

export const metadata = { title: "Order Detail", robots: { index: false, follow: false } };

interface OrderDetail {
  id: string;
  display_id?: number;
  currency_code: string;
  total: number;
  payment_status?: string;
  fulfillment_status?: string;
  items?: Array<{ id: string; title: string; variant_title?: string; quantity: number; total: number }>;
  metadata?: Record<string, unknown>;
}

export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getCustomerSession())) redirect("/account/login");
  const { id } = await params;
  const payload = await customerStoreFetch<{ order: OrderDetail }>(`/store/orders/${encodeURIComponent(id)}?fields=*items`);
  if (!payload?.order) notFound();
  const order = payload.order;
  return <><span className="eyebrow">Order detail</span><h1>Order {order.display_id ? `#${order.display_id}` : order.id}</h1><div className="account-panel" style={{ marginTop: "2rem" }}><h3>Order timeline</h3><p>Payment: {order.payment_status ?? "pending"} · Fulfillment: {order.fulfillment_status ?? "not fulfilled"}</p><ul>{order.items?.map((item) => <li key={item.id}>{item.quantity} × {item.title}{item.variant_title ? `, ${item.variant_title}` : ""}</li>)}</ul><p><strong>Total:</strong> {new Intl.NumberFormat("en-BD", { style: "currency", currency: order.currency_code.toUpperCase() }).format(order.total)}</p>{order.metadata?.is_gift ? <p>This order contains instructions for the gift recipient. Support can help with approved changes.</p> : null}</div></>;
}
