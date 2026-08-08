import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ContentWorkspace } from "../../../lib/content-workspace";

const ContentLibraryPage = () => <ContentWorkspace view="library" />;

export const config = defineRouteConfig({
  label: "Content Library",
  rank: 3,
});

export default ContentLibraryPage;
