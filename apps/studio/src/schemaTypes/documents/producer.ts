import { defineField, defineType } from "sanity";
import { publishableFields } from "../lib/fields";

export const producer = defineType({
  name: "producer",
  title: "Producer",
  type: "document",
  fields: [
    ...publishableFields,
    defineField({ name: "displayName", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "location", type: "regionReference" }),
    defineField({ name: "certifications", type: "array", of: [{ type: "string" }], description: "Only verified, current certifications." }),
    defineField({ name: "consentRecorded", type: "boolean", initialValue: false })
  ],
  preview: { select: { title: "displayName", subtitle: "verification.status", media: "heroImage" } }
});
