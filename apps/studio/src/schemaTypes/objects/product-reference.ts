import { defineField, defineType } from "sanity";

export const productReference = defineType({
  name: "productReference",
  title: "Commerce product reference",
  type: "object",
  fields: [
    defineField({ name: "medusaProductId", title: "Medusa product ID", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "handle", title: "Store handle", type: "slug", options: { source: "medusaProductId" }, validation: (rule) => rule.required() }),
    defineField({ name: "label", title: "Editorial label", type: "string" })
  ]
});
