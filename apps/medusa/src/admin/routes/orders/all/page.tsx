import { defineRouteConfig } from "@medusajs/admin-sdk";
import { AdminRouteRedirect } from "../../../lib/superadmin";

const AllOrdersPage = () => <AdminRouteRedirect destination="/orders" label="all orders" />;

export const config = defineRouteConfig({
  label: "All Orders",
  nested: "/orders",
  rank: 1,
});

export default AllOrdersPage;
