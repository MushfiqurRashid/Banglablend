import Link from "next/link";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { ListControls, Pagination } from "@/components/list-controls";
import { DEFAULT_PAGE_SIZE, pageRange, parsePage, sanitizeSearchTerm } from "@/lib/list-query";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteCatalogAction } from "./actions";

const sectionLabels: Record<string, string> = {
  originals: "Shop / Originals",
  reserve: "Shop / Reserve",
  pantry: "Shop / Pantry",
  "tea-wellness": "Shop / Tea & Wellness",
  "lifestyle-accessories": "Shop / Lifestyle Accessories",
  gifts: "Gifts",
};

const builtInCategories = [
  { id: "shop-all", name: "Shop All", handle: "all", path: "/shop/all", parent: "Shop", rule: "all" },
  { id: "shop-originals", name: "Originals", handle: "originals", path: "/shop/originals", parent: "Shop", rule: "collection", value: "originals" },
  { id: "shop-reserve", name: "Reserve", handle: "reserve", path: "/shop/reserve", parent: "Shop", rule: "collection", value: "reserve" },
  { id: "shop-pantry", name: "Pantry", handle: "pantry", path: "/shop/pantry", parent: "Shop", rule: "collection", value: "pantry" },
  { id: "shop-tea-wellness", name: "Tea & Wellness", handle: "tea-wellness", path: "/shop/tea-wellness", parent: "Shop", rule: "collection", value: "tea-wellness" },
  { id: "shop-lifestyle-accessories", name: "Lifestyle Accessories", handle: "lifestyle-accessories", path: "/shop/lifestyle-accessories", parent: "Shop", rule: "collection", value: "lifestyle-accessories" },
  { id: "shop-best-sellers", name: "Best Sellers", handle: "best-sellers", path: "/shop/best-sellers", parent: "Shop", rule: "best-sellers" },
  { id: "shop-new-arrivals", name: "New Arrivals", handle: "new-arrivals", path: "/shop/new-arrivals", parent: "Shop", rule: "new-arrivals" },
  { id: "gifts-gift-sets", name: "Gift Sets", handle: "gift-sets", path: "/gifts/gift-sets", parent: "Gifts", rule: "gift-type", value: "set" },
  { id: "gifts-regional-gifts", name: "Regional Gifts", handle: "regional-gifts", path: "/gifts/regional-gifts", parent: "Gifts", rule: "gift-type", value: "regional" },
  { id: "gifts-corporate", name: "Corporate Gifting", handle: "corporate", path: "/gifts/corporate", parent: "Gifts", rule: "gift-type", value: "corporate" },
] as const;

interface ProductPlacementRow {
  id: string;
  status: string;
  verified: boolean;
  best_seller: boolean;
  gift_type: "corporate" | "set" | "regional" | null;
  eligible_markets: string[];
  created_at: string;
  collection: { handle: string } | { handle: string }[] | null;
}

function productCollection(product: ProductPlacementRow) {
  return Array.isArray(product.collection) ? product.collection[0]?.handle : product.collection?.handle;
}

function builtInProductCount(category: (typeof builtInCategories)[number], products: ProductPlacementRow[]) {
  if (category.rule === "all") return products.length;
  if (category.rule === "collection") return products.filter((product) => productCollection(product) === category.value).length;
  if (category.rule === "best-sellers") return products.filter((product) => product.best_seller).length;
  if (category.rule === "new-arrivals") return Math.min(6, products.length);
  return products.filter((product) => productCollection(product) === "gifts" && product.gift_type === category.value).length;
}

export default async function CatalogsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const q = sanitizeSearchTerm(params.q);
  const page = parsePage(params.page);
  const { from, to } = pageRange(page);
  const session = await getStaffSession();
  const canManage = hasPermission(session, "catalog", "manage");
  const supabase = await getSupabaseForRequest();

  const [{ data: catalogs }, { data: products }] = await Promise.all([
    supabase
      .from("storefront_catalogs")
      .select("id, name, handle, section, experience, box_size, is_active, storefront_catalog_products ( product_id )")
      .order("section")
      .order("name"),
    supabase
      .from("products")
      .select("id, status, verified, best_seller, gift_type, eligible_markets, created_at, collection:product_collections!products_collection_id_fkey ( handle )")
      .is("deleted_at", null),
  ]);

  const visibleProducts = ((products ?? []) as unknown as ProductPlacementRow[])
    .filter((product) => product.status === "published" && product.verified && product.eligible_markets.includes("bd"))
    .sort((left, right) => new Date(right.created_at).valueOf() - new Date(left.created_at).valueOf());
  const visibleProductIds = new Set(visibleProducts.map((product) => product.id));
  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

  const rows = [
    ...builtInCategories.map((category) => ({
      kind: "built-in" as const,
      id: category.id,
      name: category.name,
      handle: category.handle,
      path: category.path,
      parent: category.parent,
      experience: "Built-in listing",
      productCount: builtInProductCount(category, visibleProducts),
      isActive: true,
    })),
    ...(catalogs ?? []).map((catalog) => ({
      kind: "custom" as const,
      id: catalog.id,
      name: catalog.name,
      handle: catalog.handle,
      path: catalog.section === "gifts" ? `/gifts/${catalog.handle}` : `/shop/${catalog.section}/${catalog.handle}`,
      parent: sectionLabels[catalog.section] ?? catalog.section,
      experience: catalog.experience === "build_a_box" ? `Build a Box (${catalog.box_size})` : "Custom listing",
      productCount: (catalog.storefront_catalog_products ?? []).filter((assignment) => visibleProductIds.has(assignment.product_id)).length,
      isActive: catalog.is_active,
    })),
  ];

  const normalizedQuery = q.toLowerCase();
  const filteredRows = normalizedQuery
    ? rows.filter((row) => [row.name, row.handle, row.path, row.parent].some((value) => value.toLowerCase().includes(normalizedQuery)))
    : rows;
  const pagedRows = filteredRows.slice(from, to + 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Storefront Categories</h1>
          <p style={{ color: "var(--color-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            View every built-in and custom Shop and Gift category. Built-in routes are protected; custom categories can be edited or deleted.
          </p>
        </div>
        {canManage ? <Link href="/catalogs/new" className="btn btn-primary">Create category</Link> : null}
      </div>
      <ListControls q={q} placeholder="Search category name, path, or parent section" clearHref="/catalogs" />

      <div className="card" style={{ padding: 0 }}>
        {pagedRows.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Parent section</th>
                <th>Page type</th>
                <th>Visible products</th>
                <th>Status</th>
                {canManage ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((category) => (
                <tr key={`${category.kind}:${category.id}`}>
                  <td>
                    {category.kind === "custom" ? (
                      <Link href={`/catalogs/${category.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>{category.name}</Link>
                    ) : (
                      <a href={`${storefrontUrl}${category.path}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600, textDecoration: "none" }}>{category.name}</a>
                    )}
                    <div style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>{category.path}</div>
                  </td>
                  <td>{category.parent}</td>
                  <td>{category.experience}</td>
                  <td>{category.productCount}</td>
                  <td><span className={`badge ${category.isActive ? "badge-success" : "badge-neutral"}`}>{category.isActive ? "Active" : "Inactive"}</span></td>
                  {canManage ? (
                    <td>
                      {category.kind === "custom" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <Link href={`/catalogs/${category.id}`} className="btn btn-secondary">Edit</Link>
                          <form action={deleteCatalogAction.bind(null, category.id)}>
                            <ConfirmSubmitButton message={`Delete "${category.name}"? The category and its product assignments will be removed. Products and order history will remain.`}>Delete</ConfirmSubmitButton>
                          </form>
                        </div>
                      ) : (
                        <span className="badge badge-neutral">Protected</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No storefront categories match this search.</p>
        )}
        <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={filteredRows.length} href="/catalogs" query={{ q: q || undefined }} />
      </div>
    </div>
  );
}
