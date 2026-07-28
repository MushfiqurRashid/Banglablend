import { defineField, defineType } from "sanity";

export const verificationFields = defineType({
  name: "verificationFields",
  title: "Editorial verification",
  type: "object",
  fields: [
    defineField({ name: "status", type: "string", options: { list: ["draft", "in_review", "verified", "archived"] }, initialValue: "draft", validation: (rule) => rule.required() }),
    defineField({ name: "verified", type: "boolean", initialValue: false, readOnly: ({ parent }) => parent?.status !== "verified" }),
    defineField({ name: "verifiedAt", type: "datetime", hidden: ({ parent }) => !parent?.verified }),
    defineField({ name: "sourceNotes", type: "text", rows: 4, description: "Internal citations, interview notes, or provenance evidence. Never shown publicly." })
  ]
});
