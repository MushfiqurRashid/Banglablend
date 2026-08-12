import { notFound } from "next/navigation";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { EditCatalogClient } from "./edit-catalog-client";
import { addProductToCatalogAction, deleteCatalogAction, removeProductFromCatalogAction } from "../actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function EditCatalogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getStaffSession();
  const canManage = hasPermission(session, "catalog", "manage");
  const supabase = await getSupabaseForRequest();

  const [{ data: catalog }, { data: assignments }, { data: allProducts }] = await Promise.all([
    supabase.from("storefront_catalogs").select("*").eq("id", id).maybeSingle(),
    supabase.from("storefront_catalog_products").select("product_id, product:products ( id, title, handle )").eq("catalog_id", id),
    supabase.from("products").select("id, title, handle").is("deleted_at", null).order("title"),
  ]);

  if (!catalog) notFound();

  const assignedIds = new Set((assignments ?? []).map((a) => a.product_id));
  const available = (allProducts ?? []).filter((p) => !assignedIds.has(p.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{catalog.name}</h1>
        {canManage ? <form action={deleteCatalogAction.bind(null, catalog.id)}>
          <ConfirmSubmitButton message={`Delete "${catalog.name}"? The category and its product assignments will be removed. Products and order history will remain.`}>
            Delete category
          </ConfirmSubmitButton>
        </form> : null}
      </div>

      <EditCatalogClient
        catalogId={catalog.id}
        readOnly={!canManage}
        initial={{
          name: catalog.name,
          handle: catalog.handle,
          description: catalog.description ?? "",
          navigationImageUrl: catalog.navigation_image_url ?? "",
          navigationImageAlt: catalog.navigation_image_alt ?? "",
          heroImageUrl: catalog.hero_image_url ?? "",
          heroImageAlt: catalog.hero_image_alt ?? "",
          section: catalog.section,
          experience: catalog.experience,
          boxSize: String(catalog.box_size ?? "3"),
          isActive: catalog.is_active,
        }}
      />

      <section className="card form-grid" style={{ maxWidth: 520 }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Assigned products</h2>
        {assignments?.length ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {assignments.map((assignment) => {
              const product = Array.isArray(assignment.product) ? assignment.product[0] : assignment.product;
              if (!product) return null;
              return (
                <li key={assignment.product_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
                  <span>{product.title}</span>
                  {canManage ? <form action={removeProductFromCatalogAction.bind(null, catalog.id, assignment.product_id)}>
                    <button className="btn btn-secondary" type="submit" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}>
                      Remove
                    </button>
                  </form> : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-state">No products assigned yet.</p>
        )}

        {canManage && available.length ? (
          <form action={addProductToCatalogAction.bind(null, catalog.id)} style={{ display: "flex", gap: "0.5rem" }}>
            <select className="select" name="productId" required>
              {available.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary" type="submit">
              Add
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
