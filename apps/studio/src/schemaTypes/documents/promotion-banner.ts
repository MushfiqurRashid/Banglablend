import { defineField, defineType } from "sanity";
import { languageField } from "../lib/fields";

export const promotionBanner = defineType({
  name: "promotionBanner",
  title: "Promotion banner",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    languageField,
    defineField({ name: "message", type: "text", rows: 3 }),
    defineField({ name: "image", type: "imageWithAlt" }),
    defineField({ name: "action", type: "callToAction" }),
    defineField({ name: "market", type: "string", options: { list: ["all", "bd", "gb", "us"] }, initialValue: "all" }),
    defineField({ name: "active", type: "boolean", initialValue: false })
  ]
});
