import { defineRouteConfig } from "@medusajs/admin-sdk";
import { DocumentSeries } from "@medusajs/icons";
import { Button } from "@medusajs/ui";
import { PageHeader, ResourceCard, adminPath } from "../../lib/superadmin";

const ContentPage = () => (
  <div className="flex flex-col gap-y-4 pb-8">
    <PageHeader
      title="Content"
      subtitle="Bangla Blend editorial content is managed in Sanity, while products, pricing, orders, customers, and inventory remain governed by Medusa."
      badge="Sanity CMS"
      actions={
        <Button onClick={() => window.location.assign(adminPath("/content/homepage"))}>
          Manage homepage
        </Button>
      }
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <ResourceCard
        title="Homepage"
        description="Edit the English and Bangla homepage hero, discovery sections, featured content, and campaigns."
        href={adminPath("/content/homepage")}
        badge="2 languages"
      />
      <ResourceCard
        title="Pages"
        description="Manage standard pages, legal content, customer help, and frequently asked questions."
        href={adminPath("/content/pages")}
        badge="Editorial"
      />
      <ResourceCard
        title="Content Library"
        description="Open recipes, journal stories, provenance, navigation, campaigns, and reusable media."
        href={adminPath("/content/library")}
        badge="Sanity"
      />
    </div>
  </div>
);

export const config = defineRouteConfig({
  label: "Content",
  icon: DocumentSeries,
  rank: 2,
});

export default ContentPage;
