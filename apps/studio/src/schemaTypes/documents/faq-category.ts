import { defineField, defineType } from "sanity";

export const faqCategory = defineType({
  name: "faqCategory",
  title: "FAQ category",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (rule) => rule.required() }),
    defineField({ name: "order", type: "number", initialValue: 10 })
  ]
});
