import { notFound } from "next/navigation";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { getCatalogReadiness } from "@/lib/catalog";
import { EditProductClient } from "./edit-product-client";
import { archiveProductAction } from "../actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getStaffSession();
  const canManage = hasPermission(session, "catalog", "manage");
  const supabase = await getSupabaseForRequest();

  const [{ data: product }, { data: catalogs }, { data: assignedCatalogs }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, title, handle, subtitle, description, status, thumbnail_url, thumbnail_alt, region, ingredients, storage, shelf_life, usage_notes, eligible_markets, badges, best_seller, is_placeholder, verified, gift_type, metadata, collection:product_collections!products_collection_id_fkey ( handle ), variants:product_variants ( id, title, sku, prices:product_prices ( amount ) )",
      )
      .eq("id", id)
      .is("deleted_at", null)
      .is("variants.deleted_at", null)
      .maybeSingle(),
    supabase.from("storefront_catalogs").select("id, name, section").order("name"),
    supabase.from("storefront_catalog_products").select("catalog_id").eq("product_id", id),
  ]);

  if (!product) notFound();

  const { data: inventory } = await supabase
    .from("inventory_levels")
    .select("variant_id, stocked_quantity")
    .in(
      "variant_id",
      (product.variants ?? []).map((v: { id: string }) => v.id),
    );

  const collection = Array.isArray(product.collection) ? product.collection[0] : product.collection;
  const readiness = getCatalogReadiness({
    description: product.description,
    thumbnail_url: product.thumbnail_url,
    thumbnail_alt: product.thumbnail_alt,
    status: product.status,
    verified: product.verified,
    is_placeholder: product.is_placeholder,
    eligible_markets: product.eligible_markets ?? [],
    variants: (product.variants ?? []).map((v: { id: string; sku: string | null; prices: Array<{ amount: number }> }) => ({
      sku: v.sku,
      prices: v.prices ?? [],
      stockQuantity: inventory?.find((level) => level.variant_id === v.id)?.stocked_quantity ?? 0,
    })),
  });

  const initial = {
    title: product.title,
    handle: product.handle,
    subtitle: product.subtitle ?? "",
    description: product.description ?? "",
    thumbnailUrl: product.thumbnail_url ?? "",
    thumbnailAlt: product.thumbnail_alt ?? "",
    collection: (collection?.handle ?? "originals") as "originals",
    giftType: (product.gift_type ?? "") as "",
    region: product.region ?? "",
    ingredients: product.ingredients ?? "",
    storage: product.storage ?? "",
    shelfLife: product.shelf_life ?? "",
    usageNotes: product.usage_notes ?? "",
    eligibleMarkets: product.eligible_markets ?? [],
    badges: (product.badges ?? []).join(", "),
    bestSeller: product.best_seller,
    storefrontVisible: product.status === "published" && product.verified,
    catalogIds: (assignedCatalogs ?? []).map((row: { catalog_id: string }) => row.catalog_id),
    seoTitle: (product.metadata as { seo?: { title?: string } } | null)?.seo?.title ?? "",
    seoDescription: (product.metadata as { seo?: { description?: string } } | null)?.seo?.description ?? "",
    seoImageUrl: (product.metadata as { seo?: { image?: string } } | null)?.seo?.image ?? "",
    variants: (product.variants ?? []).map((v: { title: string; sku: string | null; prices: Array<{ amount: number }> }, index: number) => {
      const variantId = (product.variants as Array<{ id: string }>)[index]?.id;
      const stock = inventory?.find((i) => i.variant_id === variantId)?.stocked_quantity ?? 0;
      return { title: v.title, sku: v.sku ?? "", bdtPrice: String(v.prices?.[0]?.amount ?? ""), stockQuantity: String(stock) };
    }),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{product.title}</h1>
          <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>{product.handle}</p>
        </div>
        {canManage ? <form action={archiveProductAction.bind(null, product.id, product.title)}>
          <ConfirmSubmitButton kind="archive" message={`Archive "${product.title}"? It will be removed from the storefront but retained in business history.`}>
            Archive
          </ConfirmSubmitButton>
        </form> : null}
      </div>

      <div className="card">
        <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem" }}>Publish readiness</h2>
        {readiness.ready ? (
          <span className="badge badge-success">Ready to publish</span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span className="badge badge-warning">Missing {readiness.missing.length} item(s)</span>
            <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.85rem", color: "var(--color-muted)" }}>
              {readiness.missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!canManage ? <div className="notice">Your role has read-only access to this product.</div> : null}
      <EditProductClient productId={product.id} initial={initial} catalogs={catalogs ?? []} readOnly={!canManage} />
    </div>
  );
}
