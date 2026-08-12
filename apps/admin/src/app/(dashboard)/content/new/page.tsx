import Link from "next/link";
import { contentRegistry } from "@/lib/content-registry";
import { requireStaffPermission } from "@/lib/auth";

export default async function AddNewContentPage() {
  await requireStaffPermission("content", "manage");
  const contentEntries = contentRegistry.filter((entry) => entry.area === "content");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Add New Content</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>Choose a content type to create a new record.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        {contentEntries.map((entry) => (
          <Link key={entry.table} href={`/content/${entry.table}/new`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card">
              <div style={{ fontWeight: 700 }}>{entry.label}</div>
              {entry.hasVerification ? <span className="badge badge-neutral" style={{ marginTop: "0.5rem" }}>Verification workflow</span> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
