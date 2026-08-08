import { Button } from "@medusajs/ui";
import { PageHeader, ResourceCard, adminPath } from "../../lib/superadmin";

const ApplicationSettingsPage = () => (
  <div className="flex flex-col gap-y-4 pb-8">
    <PageHeader
      title="Settings"
      subtitle="Configure Bangla Blend application values and open Medusa's native commerce, market, inventory, and developer settings."
      badge="Configuration"
      actions={
        <Button onClick={() => window.location.assign(adminPath("/superadmin/settings"))}>
          Application settings
        </Button>
      }
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ResourceCard
        title="Application Settings"
        description="Maintain typed Bangla Blend values, public and secret boundaries, and change history."
        href={adminPath("/superadmin/settings")}
        badge="Bangla Blend"
      />
      <ResourceCard
        title="Store Settings"
        description="Manage the store identity, currencies, locales, and core Medusa configuration."
        href={adminPath("/settings/store")}
        badge="Commerce"
      />
      <ResourceCard
        title="Regions & Markets"
        description="Configure sales regions, currencies, countries, taxes, and payment availability."
        href={adminPath("/settings/regions")}
        badge="Markets"
      />
      <ResourceCard
        title="Sales Channels"
        description="Control where products are available and connect channels to stock locations."
        href={adminPath("/settings/sales-channels")}
        badge="Catalog"
      />
      <ResourceCard
        title="Locations"
        description="Manage stock locations, fulfillment providers, service zones, and shipping options."
        href={adminPath("/settings/locations")}
        badge="Operations"
      />
      <ResourceCard
        title="API Documentation"
        description="Open the self-hosted Swagger UI for Bangla Blend's custom Medusa endpoints."
        href="/docs"
        badge="OpenAPI"
      />
    </div>
  </div>
);

export default ApplicationSettingsPage;
