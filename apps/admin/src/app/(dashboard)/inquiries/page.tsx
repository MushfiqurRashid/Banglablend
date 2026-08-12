import Link from "next/link";
import { getSupabaseForRequest } from "@/lib/auth";
import { ListControls, Pagination } from "@/components/list-controls";
import { DEFAULT_PAGE_SIZE, pageRange, parsePage, sanitizeSearchTerm } from "@/lib/list-query";

const statusBadge: Record<string, string> = {
  new: "badge-warning",
  acknowledged: "badge-neutral",
  in_progress: "badge-neutral",
  closed: "badge-success",
};

const INQUIRY_STATUSES = ["new", "acknowledged", "in_progress", "closed"];

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const params = await searchParams;
  const q = sanitizeSearchTerm(params.q);
  const status = INQUIRY_STATUSES.includes(params.status ?? "") ? params.status : undefined;
  const page = parsePage(params.page);
  const { from, to } = pageRange(page);
  const supabase = await getSupabaseForRequest();
  let query = supabase
    .from("inquiries")
    .select("id, type, status, company, contact_person, email, quantity, occasion, created_at", { count: "exact" });
  if (q) query = query.or(`email.ilike.%${q}%,contact_person.ilike.%${q}%,company.ilike.%${q}%`);
  if (status) query = query.eq("status", status);
  const { data: inquiries, count } = await query.order("created_at", { ascending: false }).range(from, to);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Inquiries</h1>
      <ListControls
        q={q}
        placeholder="Search contact, email, or company"
        filterName="status"
        filterValue={status}
        filterLabel="All inquiry statuses"
        options={INQUIRY_STATUSES.map((value) => ({ value, label: value.replaceAll("_", " ") }))}
        clearHref="/inquiries"
      />
      <div className="card" style={{ padding: 0 }}>
        {inquiries?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td style={{ textTransform: "capitalize" }}>{inquiry.type}</td>
                  <td>
                    <Link href={`/inquiries/${inquiry.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                      {inquiry.contact_person ?? inquiry.email}
                    </Link>
                    <div style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>
                      {inquiry.company ?? inquiry.email}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${statusBadge[inquiry.status]}`}>{inquiry.status.replace("_", " ")}</span>
                  </td>
                  <td>{new Date(inquiry.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No inquiries match these filters.</p>
        )}
        <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={count ?? 0} href="/inquiries" query={{ q: q || undefined, status }} />
      </div>
    </div>
  );
}
