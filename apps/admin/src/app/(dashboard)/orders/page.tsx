import Link from "next/link";
import { getSupabaseForRequest } from "@/lib/auth";
import { formatBusinessOrderReference } from "@/lib/order-workflow";
import { ListControls, Pagination } from "@/components/list-controls";
import { DEFAULT_PAGE_SIZE, pageRange, parsePage, sanitizeSearchTerm } from "@/lib/list-query";

const ORDER_STATUSES = ["pending", "completed", "archived", "canceled", "requires_action"] as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const params = await searchParams;
  const filterStatus = ORDER_STATUSES.includes(params.status as (typeof ORDER_STATUSES)[number]) ? params.status : undefined;
  const q = sanitizeSearchTerm(params.q);
  const page = parsePage(params.page);
  const { from, to } = pageRange(page);

  const supabase = await getSupabaseForRequest();
  let query = supabase
    .from("orders")
    .select("id, display_id, email, currency_code, total, status, payment_status, fulfillment_status, created_at", { count: "exact" });
  if (filterStatus) query = query.eq("status", filterStatus);
  const referenceMatch = q.match(/^order_(\d+)$/i);
  if (referenceMatch) query = query.eq("display_id", Number(referenceMatch[1]));
  else if (q) query = query.ilike("email", `%${q}%`);
  const { data: orders, count } = await query.order("created_at", { ascending: false }).range(from, to);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Orders</h1>
      <ListControls
        q={q}
        placeholder="Search email or order_01"
        filterName="status"
        filterValue={filterStatus}
        filterLabel="All order statuses"
        options={ORDER_STATUSES.map((value) => ({ value, label: value.replaceAll("_", " ") }))}
        clearHref="/orders"
      />
      <div className="card" style={{ padding: 0 }}>
        {orders?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Fulfillment</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/orders/${order.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                      {formatBusinessOrderReference(order.display_id)}
                    </Link>
                  </td>
                  <td>{order.email}</td>
                  <td>
                    {new Intl.NumberFormat("en-BD", { style: "currency", currency: order.currency_code.toUpperCase() }).format(order.total)}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{order.payment_status}</span>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{order.fulfillment_status}</span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No orders match these filters.</p>
        )}
        <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={count ?? 0} href="/orders" query={{ q: q || undefined, status: filterStatus }} />
      </div>
    </div>
  );
}
