import Link from "next/link";
import { getSupabaseForRequest } from "@/lib/auth";

export default async function CustomerTagsPage() {
  const supabase = await getSupabaseForRequest();
  const { data: customers } = await supabase.from("customers").select("tags");

  const counts = new Map<string, number>();
  for (const customer of customers ?? []) {
    for (const t of customer.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Customer Tags</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>
          Tags in use across all customers. Add or remove tags from a customer&apos;s profile page.
        </p>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {tags.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Customers</th>
              </tr>
            </thead>
            <tbody>
              {tags.map(([tag, count]) => (
                <tr key={tag}>
                  <td>
                    <Link href={`/customers?tag=${encodeURIComponent(tag)}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                      <span className="badge badge-neutral">{tag}</span>
                    </Link>
                  </td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No tags yet. Add tags from a customer&apos;s profile page.</p>
        )}
      </div>
    </div>
  );
}
