import { defineField, defineType } from "sanity";

export const seoFields = defineType({
  name: "seoFields",
  title: "Search and sharing",
  type: "object",
  fields: [
    defineField({ name: "metaTitle", title: "Meta title", type: "string", validation: (rule) => rule.max(60) }),
    defineField({ name: "metaDescription", title: "Meta description", type: "text", rows: 3, validation: (rule) => rule.max(160) }),
    defineField({ name: "shareImage", title: "Share image", type: "imageWithAlt" }),
    defineField({ name: "noIndex", title: "Exclude from search engines", type: "boolean", initialValue: false })
  ]
});
