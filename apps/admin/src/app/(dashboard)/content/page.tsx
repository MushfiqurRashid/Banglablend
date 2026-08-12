import Link from "next/link";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { contentRegistry } from "@/lib/content-registry";

export default async function ContentIndexPage() {
  const session = await getStaffSession();
  const canManage = hasPermission(session, "content", "manage");
  const supabase = await getSupabaseForRequest();
  const contentEntries = contentRegistry.filter((entry) => entry.area === "content");
  const counts = await Promise.all(contentEntries.map((entry) => supabase.from(entry.table).select("*", { count: "exact", head: true })));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>All Content</h1>
          <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>
            Review recipes, stories, sourcing profiles, and supporting editorial records.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/content/categories" className="btn btn-secondary">
            Content Categories
          </Link>
          {canManage ? <Link href="/content/new" className="btn btn-primary">Add new content</Link> : null}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        {contentEntries.map((entry, index) => (
          <Link key={entry.table} href={`/content/${entry.table}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card">
              <div style={{ fontWeight: 700 }}>{entry.label}</div>
              <div style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>{counts[index]?.count ?? 0} records</div>
              {entry.hasVerification ? <span className="badge badge-neutral" style={{ marginTop: "0.5rem" }}>Verification workflow</span> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
