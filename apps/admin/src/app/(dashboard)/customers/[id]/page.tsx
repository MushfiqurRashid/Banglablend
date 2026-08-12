import { notFound } from "next/navigation";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { CustomerTagEditor } from "./tag-editor";

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getStaffSession();
  const canManage = hasPermission(session, "customers", "manage");
  const supabase = await getSupabaseForRequest();

  const [{ data: customer }, { data: addresses }, ordersResult] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).maybeSingle(),
    supabase.from("customer_addresses").select("*").eq("customer_id", id).order("created_at"),
    supabase.from("orders").select("id, display_id, status, total, currency_code, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
  ]);
  if (!customer) notFound();

  // Orders may come back empty if the viewer's role lacks orders:view -- RLS silently returns
  // nothing rather than erroring, so the orders panel just doesn't render in that case.
  const orders = ordersResult.data ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 760 }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          {[customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email}
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>Customer since {new Date(customer.created_at).toLocaleDateString()}</p>
      </div>

      <div className="card form-grid">
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Profile</h2>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="field">
            <span className="label">Email</span>
            <span>{customer.email}</span>
          </div>
          <div className="field">
            <span className="label">Phone</span>
            <span>{customer.phone ?? "—"}</span>
          </div>
        </div>
      </div>

      {canManage ? <CustomerTagEditor customerId={customer.id} initialTags={customer.tags ?? []} /> : null}

      <div className="card" style={{ padding: 0 }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, padding: "1.25rem 1.25rem 0" }}>Addresses</h2>
        {addresses?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>City</th>
                <th>Country</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              {addresses.map((address) => (
                <tr key={address.id}>
                  <td>
                    {address.first_name} {address.last_name}
                  </td>
                  <td>
                    {address.address_1}
                    {address.address_2 ? `, ${address.address_2}` : ""}
                  </td>
                  <td>{address.city}</td>
                  <td>{address.country_code?.toUpperCase()}</td>
                  <td>
                    {address.is_default_shipping ? <span className="badge badge-neutral">Shipping</span> : null}{" "}
                    {address.is_default_billing ? <span className="badge badge-neutral">Billing</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No addresses on file.</p>
        )}
      </div>

      {orders.length ? (
        <div className="card" style={{ padding: 0 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, padding: "1.25rem 1.25rem 0" }}>Orders</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Total</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <a href={`/orders/${order.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                      order_{String(order.display_id).padStart(2, "0")}
                    </a>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{order.status}</span>
                  </td>
                  <td>{new Intl.NumberFormat("en-BD", { style: "currency", currency: order.currency_code.toUpperCase() }).format(order.total)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
