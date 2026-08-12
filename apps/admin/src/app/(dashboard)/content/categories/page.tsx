import Link from "next/link";
import { getSupabaseForRequest } from "@/lib/auth";
import { getContentType } from "@/lib/content-registry";

const CATEGORY_TABLES = ["journal_categories", "faq_categories"] as const;

export default async function ContentCategoriesPage() {
  const supabase = await getSupabaseForRequest();
  const entries = CATEGORY_TABLES.map((table) => getContentType(table)).filter((entry) => entry !== undefined);
  const counts = await Promise.all(entries.map((entry) => supabase.from(entry.table).select("*", { count: "exact", head: true })));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Content Categories</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>Category taxonomies used to organize journal articles and FAQ items.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        {entries.map((entry, index) => (
          <Link key={entry.table} href={`/content/${entry.table}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card">
              <div style={{ fontWeight: 700 }}>{entry.label}</div>
              <div style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>{counts[index]?.count ?? 0} records</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
