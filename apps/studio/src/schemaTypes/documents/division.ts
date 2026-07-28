import { defineField, defineType } from "sanity";
import { publishableFields } from "../lib/fields";

export const division = defineType({
  name: "division",
  title: "Division",
  type: "document",
  fields: [
    ...publishableFields,
    defineField({ name: "banglaName", type: "string" }),
    defineField({ name: "mapCoordinates", type: "geopoint" }),
    defineField({ name: "culinaryNotes", type: "array", of: [{ type: "string" }] })
  ],
  preview: { select: { title: "title", subtitle: "banglaName", media: "heroImage" } }
});
