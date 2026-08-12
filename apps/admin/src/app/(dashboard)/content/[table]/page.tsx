import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { getContentType } from "@/lib/content-registry";
import { ListControls, Pagination } from "@/components/list-controls";
import { DEFAULT_PAGE_SIZE, pageRange, parsePage, sanitizeSearchTerm } from "@/lib/list-query";

export default async function ContentListPage({ params, searchParams }: { params: Promise<{ table: string }>; searchParams: Promise<{ q?: string; page?: string }> }) {
  const { table } = await params;
  const search = await searchParams;
  const q = sanitizeSearchTerm(search.q);
  const page = parsePage(search.page);
  const { from, to } = pageRange(page);
  const session = await getStaffSession();
  const canManage = hasPermission(session, "content", "manage");
  const contentType = getContentType(table);
  if (!contentType) notFound();

  const supabase = await getSupabaseForRequest();
  const columns = ["id", contentType.titleColumn, contentType.hasLanguage ? "language" : null, contentType.hasVerification ? "verification_status" : null, contentType.hasVerification ? "verified" : null]
    .filter(Boolean)
    .join(", ");
  let query = supabase.from(table).select(columns, { count: "exact" });
  if (q) query = query.ilike(contentType.titleColumn, `%${q}%`);
  const { data: rows, count } = await query.order("created_at", { ascending: false }).range(from, to);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{contentType.label}</h1>
        {canManage && (!contentType.singleton || !rows?.length) ? (
          <Link href={`/content/${table}/new`} className="btn btn-primary">
            New
          </Link>
        ) : null}
      </div>
      <ListControls q={q} placeholder={`Search ${contentType.label.toLowerCase()}`} clearHref={`/content/${table}`} />

      <div className="card" style={{ padding: 0 }}>
        {rows?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>{contentType.titleColumn}</th>
                {contentType.hasLanguage ? <th>Language</th> : null}
                {contentType.hasVerification ? <th>Status</th> : null}
              </tr>
            </thead>
            <tbody>
              {(rows as unknown as Array<Record<string, unknown>>).map((row) => (
                <tr key={String(row.id)}>
                  <td>
                    <Link href={`/content/${table}/${row.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                      {String(row[contentType.titleColumn] ?? "Untitled")}
                    </Link>
                  </td>
                  {contentType.hasLanguage ? <td>{String(row.language ?? "")}</td> : null}
                  {contentType.hasVerification ? (
                    <td>
                      <span className={`badge ${row.verification_status === "verified" && row.verified ? "badge-success" : "badge-warning"}`}>{String(row.verification_status ?? "draft")}</span>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No records match this search.</p>
        )}
        <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={count ?? 0} href={`/content/${table}`} query={{ q: q || undefined }} />
      </div>
    </div>
  );
}
