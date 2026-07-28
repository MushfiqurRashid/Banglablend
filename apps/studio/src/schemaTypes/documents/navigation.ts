import { defineArrayMember, defineField, defineType } from "sanity";
import { languageField } from "../lib/fields";

export const navigation = defineType({
  name: "navigation",
  title: "Navigation",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    languageField,
    defineField({ name: "location", type: "string", options: { list: ["header", "footer_shop", "footer_explore", "footer_help"] }, validation: (rule) => rule.required() }),
    defineField({ name: "items", type: "array", of: [defineArrayMember({ type: "callToAction" })], validation: (rule) => rule.required().min(1) })
  ]
});
