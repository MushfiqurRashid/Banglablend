import { defineRouteConfig } from "@medusajs/admin-sdk";
import { AdminRouteRedirect } from "../../../lib/superadmin";

const CustomerTagsPage = () => (
  <AdminRouteRedirect destination="/customer-groups" label="customer tags" />
);

export const config = defineRouteConfig({
  label: "Customer Tags",
  nested: "/customers",
  rank: 2,
});

export default CustomerTagsPage;
