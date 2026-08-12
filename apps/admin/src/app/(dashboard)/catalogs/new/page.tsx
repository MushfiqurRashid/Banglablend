import { NewCatalogClient } from "./new-catalog-client";
import { requireStaffPermission } from "@/lib/auth";

export default async function NewCatalogPage() {
  await requireStaffPermission("catalog", "manage");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Create storefront category</h1>
      <NewCatalogClient />
    </div>
  );
}
