import Link from "next/link";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";

export default async function InventoryPage() {
  const session = await getStaffSession();
  const canManage = hasPermission(session, "catalog", "manage");
  const supabase = await getSupabaseForRequest();
  const { data: levels } = await supabase
    .from("inventory_levels")
    .select(
      "id, stocked_quantity, reserved_quantity, variant:product_variants!inner ( sku, title, product:products!inner ( id, title ) ), location:stock_locations ( name, is_primary )",
    )
    .is("variant.deleted_at", null)
    .is("variant.product.deleted_at", null)
    .order("id");

  const products = new Map<string, ProductInventoryRow>();
  for (const level of (levels ?? []) as unknown as InventoryRow[]) {
    const variant = Array.isArray(level.variant) ? level.variant[0] : level.variant;
    const product = variant && (Array.isArray(variant.product) ? variant.product[0] : variant.product);
    const location = Array.isArray(level.location) ? level.location[0] : level.location;
    if (!product || !variant) continue;

    const existing = products.get(product.id) ?? {
      id: product.id,
      title: product.title,
      variantCount: 0,
      stockedQuantity: 0,
      reservedQuantity: 0,
      locations: new Map<string, boolean>(),
    };
    existing.variantCount += 1;
    existing.stockedQuantity += level.stocked_quantity;
    existing.reservedQuantity += level.reserved_quantity;
    if (location) existing.locations.set(location.name, location.is_primary);
    products.set(product.id, existing);
  }
  const productRows = [...products.values()].sort((left, right) => left.title.localeCompare(right.title));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>View Inventory</h1>
        {canManage ? <Link href="/inventory/update" className="btn btn-primary">Update inventory</Link> : null}
      </div>
      <div className="card" style={{ padding: 0 }}>
        {productRows.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Variants</th>
                <th>Location</th>
                <th>Stocked</th>
                <th>Reserved</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((product) => (
                <tr key={product.id}>
                  <td><Link href={`/products/${product.id}`} style={{ fontWeight: 600 }}>{product.title}</Link></td>
                  <td>{product.variantCount} {product.variantCount === 1 ? "variant" : "variants"}</td>
                  <td>
                    {[...product.locations.entries()].map(([name, isPrimary], index) => (
                      <span key={name}>{index > 0 ? ", " : ""}{name} {isPrimary ? <span className="badge badge-neutral">Primary</span> : null}</span>
                    ))}
                  </td>
                  <td>{product.stockedQuantity}</td>
                  <td>{product.reservedQuantity}</td>
                  <td>{product.stockedQuantity - product.reservedQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No inventory records for current products.</p>
        )}
      </div>
    </div>
  );
}

type ProductRef = { id: string; title: string };
type VariantRef = { sku: string | null; title: string; product: ProductRef | ProductRef[] };
type LocationRef = { name: string; is_primary: boolean };

interface InventoryRow {
  id: string;
  stocked_quantity: number;
  reserved_quantity: number;
  variant: VariantRef | VariantRef[];
  location: LocationRef | LocationRef[];
}

interface ProductInventoryRow {
  id: string;
  title: string;
  variantCount: number;
  stockedQuantity: number;
  reservedQuantity: number;
  locations: Map<string, boolean>;
}
