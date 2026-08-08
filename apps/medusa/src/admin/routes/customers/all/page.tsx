import { defineRouteConfig } from "@medusajs/admin-sdk";
import { AdminRouteRedirect } from "../../../lib/superadmin";

const AllCustomersPage = () => (
  <AdminRouteRedirect destination="/customers" label="all customers" />
);

export const config = defineRouteConfig({
  label: "All Customers",
  nested: "/customers",
  rank: 1,
});

export default AllCustomersPage;
