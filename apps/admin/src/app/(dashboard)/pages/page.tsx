import Link from "next/link";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";

interface PageRow {
  id: string;
  title: string;
  slug: string;
  verification_status: string;
  verified: boolean;
  updated_at: string;
  type: "Standard" | "Legal";
}

export default async function PagesListPage() {
  const session = await getStaffSession();
  const canManage = hasPermission(session, "content", "manage");
  const supabase = await getSupabaseForRequest();
  const [{ data: standardPages }, { data: legalPages }] = await Promise.all([
    supabase.from("standard_pages").select("id, title, slug, verification_status, verified, updated_at"),
    supabase.from("legal_pages").select("id, title, slug, verification_status, verified, updated_at"),
  ]);

  const rows: PageRow[] = [
    ...(standardPages ?? []).map((p) => ({ ...p, type: "Standard" as const })),
    ...(legalPages ?? []).map((p) => ({ ...p, type: "Legal" as const })),
  ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const tableForType = (type: "Standard" | "Legal") => (type === "Standard" ? "standard_pages" : "legal_pages");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Editable Page List</h1>
        {canManage ? <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/content/standard_pages/new" className="btn btn-secondary">
            New standard page
          </Link>
          <Link href="/content/legal_pages/new" className="btn btn-primary">
            New legal page
          </Link>
        </div> : null}
      </div>
      <div className="card" style={{ padding: 0 }}>
        {rows.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((page) => (
                <tr key={`${page.type}-${page.id}`}>
                  <td>
                    <Link href={`/content/${tableForType(page.type)}/${page.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                      {page.title}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{page.type}</span>
                  </td>
                  <td>
                    <span className={`badge ${page.verification_status === "verified" && page.verified ? "badge-success" : "badge-warning"}`}>
                      {page.verification_status}
                    </span>
                  </td>
                  <td>{new Date(page.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No pages yet.</p>
        )}
      </div>
    </div>
  );
}
