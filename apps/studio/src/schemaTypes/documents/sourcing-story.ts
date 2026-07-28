import { defineArrayMember, defineField, defineType } from "sanity";
import { publishableFields } from "../lib/fields";

export const sourcingStory = defineType({
  name: "sourcingStory",
  title: "Sourcing story",
  type: "document",
  fields: [
    ...publishableFields,
    defineField({ name: "ingredient", type: "reference", to: [{ type: "ingredient" }] }),
    defineField({ name: "farmers", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "farmer" }] })] }),
    defineField({ name: "producers", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "producer" }] })] }),
    defineField({ name: "place", type: "regionReference" }),
    defineField({ name: "harvestWindow", type: "string" }),
    defineField({ name: "traceabilityNotes", type: "text", rows: 5 })
  ],
  preview: { select: { title: "title", subtitle: "verification.status", media: "heroImage" } }
});
