import { defineField, defineType } from "sanity";
import { publishableFields } from "../lib/fields";

export const ingredient = defineType({
  name: "ingredient",
  title: "Ingredient",
  type: "document",
  fields: [
    ...publishableFields,
    defineField({ name: "banglaName", type: "string" }),
    defineField({ name: "flavor", type: "flavorProfile" }),
    defineField({ name: "origin", type: "regionReference" }),
    defineField({ name: "allergenStatement", type: "text", rows: 2, description: "Use verified packaging/legal language only." })
  ],
  preview: { select: { title: "title", subtitle: "banglaName", media: "heroImage" } }
});
