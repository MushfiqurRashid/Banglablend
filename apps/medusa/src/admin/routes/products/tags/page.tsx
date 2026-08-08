import { defineRouteConfig } from "@medusajs/admin-sdk";
import { AdminRouteRedirect } from "../../../lib/superadmin";

const ProductTagsPage = () => (
  <AdminRouteRedirect destination="/settings/product-tags" label="product tags" />
);

export const config = defineRouteConfig({
  label: "Tags",
  nested: "/products",
  rank: 2,
});

export default ProductTagsPage;
