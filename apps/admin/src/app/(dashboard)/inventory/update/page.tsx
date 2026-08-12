import { getSupabaseForRequest, requireStaffPermission } from "@/lib/auth";
import { updateInventoryLevelAction } from "../actions";

type ProductRef = { title: string };
type VariantRef = { sku: string | null; title: string; product: ProductRef | ProductRef[] };
type LocationRef = { name: string; is_primary: boolean };

interface InventoryRow {
  id: string;
  stocked_quantity: number;
  reserved_quantity: number;
  variant: VariantRef | VariantRef[];
  location: LocationRef | LocationRef[];
}

export default async function UpdateInventoryPage() {
  await requireStaffPermission("catalog", "manage");
  const supabase = await getSupabaseForRequest();
  const { data: levels } = await supabase
    .from("inventory_levels")
    .select(
      "id, stocked_quantity, reserved_quantity, variant:product_variants!inner ( sku, title, product:products!inner ( title ) ), location:stock_locations ( name, is_primary )",
    )
    .is("variant.deleted_at", null)
    .is("variant.product.deleted_at", null)
    .order("id");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Update Inventory</h1>
      <div className="card" style={{ padding: 0 }}>
        {levels?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant / SKU</th>
                <th>Location</th>
                <th>Stocked</th>
                <th>Reserved</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(levels as unknown as InventoryRow[]).map((level) => {
                const variant = Array.isArray(level.variant) ? level.variant[0] : level.variant;
                const product = variant && (Array.isArray(variant.product) ? variant.product[0] : variant.product);
                const location = Array.isArray(level.location) ? level.location[0] : level.location;
                const boundAction = updateInventoryLevelAction.bind(null, level.id);
                return (
                  <tr key={level.id}>
                    <td>{product?.title ?? "—"}</td>
                    <td>
                      {variant?.title ?? "—"} <span style={{ color: "var(--color-muted)" }}>({variant?.sku ?? "—"})</span>
                    </td>
                    <td>{location?.name ?? "—"}</td>
                    <td colSpan={3}>
                      <form action={boundAction} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input
                          className="input"
                          type="number"
                          name="stockedQuantity"
                          min={0}
                          step={1}
                          defaultValue={level.stocked_quantity}
                          style={{ width: 90 }}
                        />
                        <input
                          className="input"
                          type="number"
                          name="reservedQuantity"
                          min={0}
                          step={1}
                          defaultValue={level.reserved_quantity}
                          style={{ width: 90 }}
                        />
                        <button className="btn btn-secondary" type="submit" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}>
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No inventory records yet.</p>
        )}
      </div>
    </div>
  );
}
