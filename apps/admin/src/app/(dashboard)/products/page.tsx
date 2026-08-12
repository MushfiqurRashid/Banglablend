import Link from "next/link";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { DeleteProductButton } from "./delete-product-button";
import { ListControls, Pagination } from "@/components/list-controls";
import { DEFAULT_PAGE_SIZE, pageRange, parsePage, sanitizeSearchTerm } from "@/lib/list-query";

const PRODUCT_STATUSES = ["draft", "proposed", "published", "rejected"];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const params = await searchParams;
  const q = sanitizeSearchTerm(params.q);
  const status = PRODUCT_STATUSES.includes(params.status ?? "") ? params.status : undefined;
  const page = parsePage(params.page);
  const { from, to } = pageRange(page);
  const session = await getStaffSession();
  const canManage = hasPermission(session, "catalog", "manage");
  const supabase = await getSupabaseForRequest();
  let query = supabase
    .from("products")
    .select("id, title, handle, status, verified, is_placeholder, best_seller, collection:product_collections!products_collection_id_fkey ( title )", { count: "exact" })
    .is("deleted_at", null);
  if (q) query = query.or(`title.ilike.%${q}%,handle.ilike.%${q}%`);
  if (status) query = query.eq("status", status);
  const { data: products, count } = await query.order("created_at", { ascending: false }).range(from, to);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Products</h1>
        {canManage ? <Link href="/products/new" className="btn btn-primary">New product</Link> : null}
      </div>
      <ListControls
        q={q}
        placeholder="Search title or handle"
        filterName="status"
        filterValue={status}
        filterLabel="All statuses"
        options={PRODUCT_STATUSES.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))}
        clearHref="/products"
      />

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {products?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Collection</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const collection = Array.isArray(product.collection) ? product.collection[0] : product.collection;
                return (
                  <tr key={product.id}>
                    <td>
                      <Link href={`/products/${product.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                        {product.title}
                      </Link>
                      <div style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>{product.handle}</div>
                    </td>
                    <td>{collection?.title ?? "—"}</td>
                    <td>
                      <span className={`badge ${product.status === "published" ? "badge-success" : "badge-neutral"}`}>{product.status}</span>
                    </td>
                    <td>
                      {product.verified && !product.is_placeholder ? <span className="badge badge-success">Verified</span> : <span className="badge badge-warning">Not verified</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link href={`/products/${product.id}`} className="btn btn-secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}>
                          {canManage ? "Edit" : "View"}
                        </Link>
                        {canManage ? <DeleteProductButton id={product.id} title={product.title} /> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No products match these filters.</p>
        )}
        <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={count ?? 0} href="/products" query={{ q: q || undefined, status }} />
      </div>
    </div>
  );
}
