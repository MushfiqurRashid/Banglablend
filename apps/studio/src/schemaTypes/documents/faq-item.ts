import { defineField, defineType } from "sanity";
import { languageField } from "../lib/fields";

export const faqItem = defineType({
  name: "faqItem",
  title: "FAQ item",
  type: "document",
  fields: [
    defineField({ name: "question", type: "string", validation: (rule) => rule.required() }),
    languageField,
    defineField({ name: "category", type: "reference", to: [{ type: "faqCategory" }], validation: (rule) => rule.required() }),
    defineField({ name: "answer", type: "portableText", validation: (rule) => rule.required() }),
    defineField({ name: "order", type: "number", initialValue: 10 }),
    defineField({ name: "published", type: "boolean", initialValue: false })
  ],
  preview: { select: { title: "question", subtitle: "category.title" } }
});
