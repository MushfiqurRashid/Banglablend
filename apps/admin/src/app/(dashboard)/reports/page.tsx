import { getStaffSession, getSupabaseForRequest, hasPermission, requireStaffPermission } from "@/lib/auth";

function NoAccessCard({ label }: { label: string }) {
  return (
    <div className="card">
      <div style={{ fontWeight: 700 }}>{label}</div>
      <p className="empty-state" style={{ padding: "0.5rem 0", textAlign: "left" }}>
        You don&apos;t have access to this section.
      </p>
    </div>
  );
}

export default async function ReportsPage() {
  await requireStaffPermission("reports", "view");
  const session = await getStaffSession();
  const supabase = await getSupabaseForRequest();

  const canViewOrders = hasPermission(session, "orders", "view");
  const canViewCatalog = hasPermission(session, "catalog", "view");
  const canViewPayments = hasPermission(session, "payments", "view");
  const canViewCustomers = hasPermission(session, "customers", "view");

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [ordersResult, lineItemsResult, inventoryResult, paymentFailureResult, newCustomersResult] = await Promise.all([
    canViewOrders ? supabase.from("orders").select("total, status, created_at") : Promise.resolve({ data: null }),
    canViewOrders ? supabase.from("order_line_items").select("title, quantity") : Promise.resolve({ data: null }),
    canViewCatalog
      ? supabase
          .from("inventory_levels")
          .select("stocked_quantity, reserved_quantity, variant:product_variants!inner ( sku, title, product:products!inner ( id ) )")
          .is("variant.deleted_at", null)
          .is("variant.product.deleted_at", null)
      : Promise.resolve({ data: null }),
    canViewPayments ? supabase.from("payment_audits").select("id", { count: "exact", head: true }).eq("status", "failed") : Promise.resolve({ count: null }),
    canViewCustomers
      ? supabase.from("customers").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth)
      : Promise.resolve({ count: null }),
  ]);

  const orders = ordersResult.data ?? [];
  const revenueAllTime = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const revenue30d = orders.filter((o) => o.created_at >= thirtyDaysAgo).reduce((sum, o) => sum + Number(o.total), 0);
  const statusCounts = new Map<string, number>();
  for (const o of orders) statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);

  const lineItems = lineItemsResult.data ?? [];
  const unitsByTitle = new Map<string, number>();
  for (const item of lineItems) unitsByTitle.set(item.title, (unitsByTitle.get(item.title) ?? 0) + item.quantity);
  const topProducts = [...unitsByTitle.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  type InventoryLevelRow = { stocked_quantity: number; reserved_quantity: number; variant: { sku: string | null; title: string } | { sku: string | null; title: string }[] };
  const lowStock = ((inventoryResult.data ?? []) as InventoryLevelRow[])
    .map((level) => {
      const variant = Array.isArray(level.variant) ? level.variant[0] : level.variant;
      return { sku: variant?.sku ?? "—", title: variant?.title ?? "—", available: level.stocked_quantity - level.reserved_quantity };
    })
    .filter((row) => row.available < 10)
    .sort((a, b) => a.available - b.available);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Reports &amp; Analytics</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        {canViewOrders ? (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Revenue</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(revenue30d)}
            </div>
            <div style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>last 30 days</div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
              {new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(revenueAllTime)} all time
            </div>
          </div>
        ) : (
          <NoAccessCard label="Revenue" />
        )}

        {canViewOrders ? (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Orders by status</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {[...statusCounts.entries()].map(([status, count]) => (
                <div key={status} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span className="badge badge-neutral">{status}</span>
                  <span>{count}</span>
                </div>
              ))}
              {statusCounts.size === 0 ? <p className="empty-state">No orders yet.</p> : null}
            </div>
          </div>
        ) : (
          <NoAccessCard label="Orders by status" />
        )}

        {canViewOrders ? (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Top products by units sold</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {topProducts.map(([title, units]) => (
                <div key={title} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span>{title}</span>
                  <span>{units}</span>
                </div>
              ))}
              {topProducts.length === 0 ? <p className="empty-state">No sales yet.</p> : null}
            </div>
          </div>
        ) : (
          <NoAccessCard label="Top products by units sold" />
        )}

        {canViewCatalog ? (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Low stock alerts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {lowStock.slice(0, 10).map((row) => (
                <div key={row.sku} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span>
                    {row.title} <span style={{ color: "var(--color-muted)" }}>({row.sku})</span>
                  </span>
                  <span className={row.available <= 0 ? "badge badge-danger" : "badge badge-warning"}>{row.available}</span>
                </div>
              ))}
              {lowStock.length === 0 ? <p className="empty-state">No low-stock variants.</p> : null}
            </div>
          </div>
        ) : (
          <NoAccessCard label="Low stock alerts" />
        )}

        {canViewPayments ? (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Failed payments</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{paymentFailureResult.count ?? 0}</div>
          </div>
        ) : (
          <NoAccessCard label="Failed payments" />
        )}

        {canViewCustomers ? (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>New customers this month</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{newCustomersResult.count ?? 0}</div>
          </div>
        ) : (
          <NoAccessCard label="New customers this month" />
        )}
      </div>
    </div>
  );
}
