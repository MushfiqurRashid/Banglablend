import { redirect } from "next/navigation";
import { getCustomerSession, getSupabaseForRequest } from "@/lib/auth/server";
import { OrdersTable } from "@/components/account/orders-table";

export const metadata = { title: "Orders", robots: { index: false, follow: false } };

export default async function OrdersPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");

  const supabase = await getSupabaseForRequest();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, display_id, created_at, currency_code, total, payment_status, fulfillment_status")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <span className="eyebrow">Purchase history</span>
      <h1>My Orders</h1>
      <OrdersTable orders={orders ?? []} />
    </>
  );
}
