import { defineField, defineType } from "sanity";

export const journalCategory = defineType({
  name: "journalCategory",
  title: "Journal category",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (rule) => rule.required() }),
    defineField({ name: "description", type: "text", rows: 3 })
  ]
});
