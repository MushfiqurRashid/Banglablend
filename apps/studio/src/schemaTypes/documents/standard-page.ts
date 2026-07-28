import { defineType } from "sanity";
import { publishableFields } from "../lib/fields";

export const standardPage = defineType({
  name: "standardPage",
  title: "Standard page",
  type: "document",
  fields: publishableFields,
  preview: { select: { title: "title", subtitle: "slug.current", media: "heroImage" } }
});
