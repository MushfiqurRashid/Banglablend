import { defineRouteConfig } from "@medusajs/admin-sdk";
import { AdminRouteRedirect } from "../../../lib/superadmin";

const ProductEditorPage = () => (
  <AdminRouteRedirect destination="/superadmin/catalog" label="the product editor" />
);

export const config = defineRouteConfig({
  label: "Product Editor",
  nested: "/products",
  rank: 3,
});

export default ProductEditorPage;
