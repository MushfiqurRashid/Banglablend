import { defineRouteConfig } from "@medusajs/admin-sdk";
import { AdminRouteRedirect } from "../../../lib/superadmin";

const InventoryListPage = () => (
  <AdminRouteRedirect destination="/inventory" label="the inventory list" />
);

export const config = defineRouteConfig({
  label: "Inventory List",
  nested: "/inventory",
  rank: 1,
});

export default InventoryListPage;
