import Link from "next/link";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";

export default async function HomepageSectionEditorPage() {
  const session = await getStaffSession();
  const canManage = hasPermission(session, "content", "manage");
  const supabase = await getSupabaseForRequest();
  const { data: homepage } = await supabase.from("homepages").select("id, title").eq("language", "en").maybeSingle();

  const cards = [
    {
      label: "Homepage content",
      description: "Headline, introduction, hero image, and SEO for the English homepage.",
      href: homepage ? `/content/homepages/${homepage.id}` : canManage ? "/content/homepages/new" : "/content/homepages",
    },
    {
      label: "Featured products",
      description: "Products highlighted on the homepage, in display order.",
      href: "/content/homepage_featured_products",
    },
    {
      label: "Navigation menus",
      description: "Header and footer navigation links.",
      href: "/content/navigations",
    },
    {
      label: "Top announcement text",
      description: "Edit the sentence in the green bar above the storefront header.",
      href: "/homepage/announcement",
    },
    {
      label: "Promotion banners",
      description: "Homepage and campaign promotion banners.",
      href: "/content/promotion_banners",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Homepage Section Editor</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>Manage every section that appears on the storefront homepage.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card">
              <div style={{ fontWeight: 700 }}>{card.label}</div>
              <div style={{ color: "var(--color-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>{card.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
