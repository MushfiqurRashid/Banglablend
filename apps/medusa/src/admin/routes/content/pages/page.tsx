import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ContentWorkspace } from "../../../lib/content-workspace";

const PagesContentPage = () => <ContentWorkspace view="pages" />;

export const config = defineRouteConfig({
  label: "Pages",
  rank: 2,
});

export default PagesContentPage;
