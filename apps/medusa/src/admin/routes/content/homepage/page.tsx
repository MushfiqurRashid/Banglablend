import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ContentWorkspace } from "../../../lib/content-workspace";

const HomepageContentPage = () => <ContentWorkspace view="homepage" />;

export const config = defineRouteConfig({
  label: "Homepage",
  rank: 1,
});

export default HomepageContentPage;
