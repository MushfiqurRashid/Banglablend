import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Users } from "@medusajs/icons";
import { Button } from "@medusajs/ui";
import { PageHeader, ResourceCard, adminPath } from "../../lib/superadmin";

const UsersPage = () => (
  <div className="flex flex-col gap-y-4 pb-8">
    <PageHeader
      title="Users"
      subtitle="Invite administrators and assign role-based access through Medusa's native user, role, and policy management screens."
      badge="Access control"
      actions={
        <Button onClick={() => window.location.assign(adminPath("/settings/users/invite"))}>
          Invite user
        </Button>
      }
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ResourceCard
        title="All Users"
        description="Review administrators, account state, profile details, and current assignments."
        href={adminPath("/settings/users")}
        badge="Medusa"
      />
      <ResourceCard
        title="Roles"
        description="Create reusable access roles and assign the correct administrators to each role."
        href={adminPath("/settings/roles")}
        badge="RBAC"
      />
      <ResourceCard
        title="Policies"
        description="Inspect resource permissions used to protect catalog and operational workflows."
        href={adminPath("/settings/policies")}
        badge="Permissions"
      />
      <ResourceCard
        title="Access Audit"
        description="Review governed administrator changes and the actor responsible for each event."
        href={adminPath("/superadmin/audit")}
        badge="Evidence"
      />
    </div>
  </div>
);

export const config = defineRouteConfig({
  label: "Users",
  icon: Users,
  rank: 4,
});

export default UsersPage;
