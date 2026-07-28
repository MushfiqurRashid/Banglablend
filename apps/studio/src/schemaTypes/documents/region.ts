import { defineArrayMember, defineField, defineType } from "sanity";
import { publishableFields } from "../lib/fields";

export const region = defineType({
  name: "region",
  title: "Region",
  type: "document",
  fields: [
    ...publishableFields,
    defineField({ name: "division", type: "reference", to: [{ type: "division" }], validation: (rule) => rule.required() }),
    defineField({ name: "coordinates", type: "geopoint" }),
    defineField({ name: "signatureIngredients", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "ingredient" }] })] }),
    defineField({ name: "featuredProducts", type: "array", of: [defineArrayMember({ type: "productReference" })] })
  ],
  preview: { select: { title: "title", subtitle: "division.title", media: "heroImage" } }
});
