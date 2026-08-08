import { defineRouteConfig } from "@medusajs/admin-sdk";
import { AdminRouteRedirect } from "../../../lib/superadmin";

const AllProductsPage = () => <AdminRouteRedirect destination="/products" label="all products" />;

export const config = defineRouteConfig({
  label: "All Products",
  nested: "/products",
  rank: 1,
});

export default AllProductsPage;
