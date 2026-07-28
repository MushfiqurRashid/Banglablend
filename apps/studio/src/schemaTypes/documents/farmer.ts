import { defineField, defineType } from "sanity";
import { publishableFields } from "../lib/fields";

export const farmer = defineType({
  name: "farmer",
  title: "Farmer",
  type: "document",
  fields: [
    ...publishableFields,
    defineField({ name: "displayName", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "location", type: "regionReference" }),
    defineField({ name: "consentRecorded", type: "boolean", initialValue: false, validation: (rule) => rule.custom((value) => value === true || "Documented publication consent is required.") }),
    defineField({ name: "consentNotes", type: "text", rows: 3 })
  ],
  preview: { select: { title: "displayName", subtitle: "verification.status", media: "heroImage" } }
});
