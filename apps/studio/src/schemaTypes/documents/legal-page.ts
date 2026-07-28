import { defineField, defineType } from "sanity";
import { publishableFields } from "../lib/fields";

export const legalPage = defineType({
  name: "legalPage",
  title: "Legal page",
  type: "document",
  fields: [
    ...publishableFields,
    defineField({ name: "effectiveDate", type: "date", validation: (rule) => rule.required() }),
    defineField({ name: "reviewOwner", type: "string" }),
    defineField({ name: "legalApprovalRecorded", type: "boolean", initialValue: false })
  ],
  preview: { select: { title: "title", subtitle: "effectiveDate" } }
});
