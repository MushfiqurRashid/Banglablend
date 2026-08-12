import { getSupabaseForRequest, requireStaffPermission } from "@/lib/auth";
import { NewProductClient } from "./new-product-client";

export default async function NewProductPage() {
  await requireStaffPermission("catalog", "manage");
  const supabase = await getSupabaseForRequest();
  const { data: catalogs } = await supabase.from("storefront_catalogs").select("id, name, section").order("name");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>New product</h1>
      <NewProductClient catalogs={catalogs ?? []} />
    </div>
  );
}
