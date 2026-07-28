import { model } from "@medusajs/framework/utils";

const AdminAuditLog = model
  .define("admin_audit_log", {
    id: model.id().primaryKey(),
    actor_id: model.text(),
    actor_email: model.text().nullable(),
    action: model.text().searchable(),
    resource_type: model.text().searchable(),
    resource_id: model.text().nullable(),
    resource_label: model.text().nullable(),
    summary: model.text(),
    before: model.json().nullable(),
    after: model.json().nullable(),
    request_id: model.text().nullable(),
    metadata: model.json().nullable()
  })
  .indexes([
    {
      on: ["resource_type"],
      where: "deleted_at IS NULL"
    },
    {
      on: ["action"],
      where: "deleted_at IS NULL"
    },
    {
      on: ["actor_id"],
      where: "deleted_at IS NULL"
    }
  ]);

export default AdminAuditLog;
