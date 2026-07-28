import { defineArrayMember, defineField, defineType } from "sanity";
import { publishableFields } from "../lib/fields";

export const journalArticle = defineType({
  name: "journalArticle",
  title: "Journal article",
  type: "document",
  fields: [
    ...publishableFields,
    defineField({ name: "author", type: "reference", to: [{ type: "author" }], validation: (rule) => rule.required() }),
    defineField({ name: "category", type: "reference", to: [{ type: "journalCategory" }], validation: (rule) => rule.required() }),
    defineField({ name: "publishedAt", type: "datetime" }),
    defineField({ name: "places", type: "array", of: [defineArrayMember({ type: "regionReference" })] }),
    defineField({ name: "relatedProducts", type: "array", of: [defineArrayMember({ type: "productReference" })] })
  ],
  preview: { select: { title: "title", subtitle: "category.title", media: "heroImage" } }
});
