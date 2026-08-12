import Link from "next/link";
import { getSupabaseForRequest } from "@/lib/auth";
import { ListControls, Pagination } from "@/components/list-controls";
import { DEFAULT_PAGE_SIZE, pageRange, parsePage, sanitizeSearchTerm } from "@/lib/list-query";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ tag?: string; q?: string; page?: string }> }) {
  const params = await searchParams;
  const tag = params.tag?.trim().slice(0, 50);
  const q = sanitizeSearchTerm(params.q);
  const page = parsePage(params.page);
  const { from, to } = pageRange(page);
  const supabase = await getSupabaseForRequest();
  let query = supabase
    .from("customers")
    .select("id, email, first_name, last_name, phone, tags, created_at", { count: "exact" });
  if (tag) query = query.contains("tags", [tag]);
  if (q) query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data: customers, count } = await query.order("created_at", { ascending: false }).range(from, to);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>All Customers</h1>
        <Link href="/customers/tags" className="btn btn-secondary">
          Customer Tags
        </Link>
      </div>
      <ListControls q={q} placeholder="Search customer name, email, or phone" clearHref="/customers" />

      {tag ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-muted)" }}>
          Filtered by tag: <span className="badge badge-neutral">{tag}</span>
          <Link href="/customers" style={{ color: "var(--color-primary)" }}>
            Clear
          </Link>
        </div>
      ) : null}

      <div className="card" style={{ padding: 0 }}>
        {customers?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tags</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <Link href={`/customers/${customer.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                      {[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "—"}
                    </Link>
                  </td>
                  <td>{customer.email}</td>
                  <td>{customer.phone ?? "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                      {(customer.tags ?? []).map((t: string) => (
                        <span key={t} className="badge badge-neutral">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No customers match these filters.</p>
        )}
        <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={count ?? 0} href="/customers" query={{ q: q || undefined, tag }} />
      </div>
    </div>
  );
}
