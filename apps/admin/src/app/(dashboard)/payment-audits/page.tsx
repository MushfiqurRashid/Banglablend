import { getSupabaseForRequest } from "@/lib/auth";
import { ListControls, Pagination } from "@/components/list-controls";
import { DEFAULT_PAGE_SIZE, pageRange, parsePage, sanitizeSearchTerm } from "@/lib/list-query";

const statusBadge: Record<string, string> = {
  captured: "badge-success",
  completed: "badge-success",
  failed: "badge-danger",
  rejected: "badge-danger",
};

const PAYMENT_AUDIT_STATUSES = ["pending", "captured", "completed", "failed", "rejected"];

export default async function PaymentAuditsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const params = await searchParams;
  const q = sanitizeSearchTerm(params.q);
  const status = PAYMENT_AUDIT_STATUSES.includes(params.status ?? "") ? params.status : undefined;
  const page = parsePage(params.page);
  const { from, to } = pageRange(page);
  const supabase = await getSupabaseForRequest();
  let query = supabase
    .from("payment_audits")
    .select("id, provider, transaction_id, order_reference, event_type, status, amount, currency, processed_at, created_at", { count: "exact" });
  if (q) query = query.or(`transaction_id.ilike.%${q}%,order_reference.ilike.%${q}%,event_type.ilike.%${q}%`);
  if (status) query = query.eq("status", status);
  const { data: audits, count } = await query.order("created_at", { ascending: false }).range(from, to);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Payment Audits</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>Append-only reconciliation ledger. Nothing here can be edited or deleted.</p>
      </div>
      <ListControls
        q={q}
        placeholder="Search transaction or order reference"
        filterName="status"
        filterValue={status}
        filterLabel="All payment statuses"
        options={PAYMENT_AUDIT_STATUSES.map((value) => ({ value, label: value }))}
        clearHref="/payment-audits"
      />
      <div className="card" style={{ padding: 0 }}>
        {audits?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Transaction</th>
                <th>Event</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit.id}>
                  <td style={{ textTransform: "uppercase", fontSize: "0.75rem" }}>{audit.provider}</td>
                  <td>
                    {audit.transaction_id}
                    {audit.order_reference ? <div style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>{audit.order_reference}</div> : null}
                  </td>
                  <td>{audit.event_type}</td>
                  <td>
                    <span className={`badge ${statusBadge[audit.status] ?? "badge-neutral"}`}>{audit.status}</span>
                  </td>
                  <td>{audit.amount ? `${audit.amount} ${audit.currency?.toUpperCase() ?? ""}` : "—"}</td>
                  <td>{new Date(audit.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No payment events match these filters.</p>
        )}
        <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={count ?? 0} href="/payment-audits" query={{ q: q || undefined, status }} />
      </div>
    </div>
  );
}
