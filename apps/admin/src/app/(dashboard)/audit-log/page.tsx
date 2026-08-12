import { getSupabaseForRequest } from "@/lib/auth";
import { ListControls, Pagination } from "@/components/list-controls";
import { DEFAULT_PAGE_SIZE, pageRange, parsePage, sanitizeSearchTerm } from "@/lib/list-query";

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const q = sanitizeSearchTerm(params.q);
  const page = parsePage(params.page);
  const { from, to } = pageRange(page);
  const supabase = await getSupabaseForRequest();
  let query = supabase
    .from("admin_audit_log")
    .select("id, actor_email, action, resource_type, resource_label, summary, created_at", { count: "exact" });
  if (q) query = query.or(`actor_email.ilike.%${q}%,action.ilike.%${q}%,resource_type.ilike.%${q}%,resource_label.ilike.%${q}%,summary.ilike.%${q}%`);
  const { data: entries, count } = await query.order("created_at", { ascending: false }).range(from, to);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Admin Audit Log</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>Append-only record of administrative changes.</p>
      </div>
      <ListControls q={q} placeholder="Search action, resource, or staff email" clearHref="/audit-log" />
      <div className="card" style={{ padding: 0 }}>
        {entries?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Resource</th>
                <th>Summary</th>
                <th>Actor</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.action}</td>
                  <td>
                    {entry.resource_type}
                    {entry.resource_label ? <div style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>{entry.resource_label}</div> : null}
                  </td>
                  <td>{entry.summary}</td>
                  <td>{entry.actor_email ?? "system"}</td>
                  <td>{new Date(entry.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No administrator activity matches this search.</p>
        )}
        <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={count ?? 0} href="/audit-log" query={{ q: q || undefined }} />
      </div>
    </div>
  );
}
