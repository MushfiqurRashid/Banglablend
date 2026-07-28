import { model } from "@medusajs/framework/utils";

const AppSetting = model
  .define("app_setting", {
    id: model.id().primaryKey(),
    key: model.text().searchable(),
    group: model.text().searchable().default("general"),
    label: model.text(),
    description: model.text().nullable(),
    value: model.json(),
    value_type: model.enum(["string", "number", "boolean", "json"]).default("string"),
    is_public: model.boolean().default(false),
    is_secret: model.boolean().default(false),
    sort_order: model.number().default(0),
    updated_by: model.text().nullable(),
    metadata: model.json().nullable()
  })
  .indexes([
    {
      on: ["key"],
      unique: true,
      where: "deleted_at IS NULL"
    },
    {
      on: ["group"],
      where: "deleted_at IS NULL"
    }
  ]);

export default AppSetting;
