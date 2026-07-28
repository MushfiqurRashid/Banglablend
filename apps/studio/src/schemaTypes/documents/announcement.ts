import { defineField, defineType } from "sanity";
import { languageField } from "../lib/fields";

export const announcement = defineType({
  name: "announcement",
  title: "Announcement",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    languageField,
    defineField({ name: "message", type: "string", validation: (rule) => rule.required().max(150) }),
    defineField({ name: "link", type: "callToAction" }),
    defineField({ name: "market", type: "string", options: { list: ["all", "bd", "gb", "us"] }, initialValue: "all" }),
    defineField({ name: "startsAt", type: "datetime" }),
    defineField({ name: "endsAt", type: "datetime" }),
    defineField({ name: "active", type: "boolean", initialValue: false })
  ]
});
