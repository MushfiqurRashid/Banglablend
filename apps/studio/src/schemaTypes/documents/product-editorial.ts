import { defineArrayMember, defineField, defineType } from "sanity";
import { languageField } from "../lib/fields";

export const productEditorial = defineType({
  name: "productEditorial",
  title: "Product editorial",
  type: "document",
  fields: [
    defineField({ name: "product", type: "productReference", validation: (rule) => rule.required() }),
    languageField,
    defineField({ name: "editorialTitle", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "shortStory", type: "text", rows: 4 }),
    defineField({ name: "story", type: "portableText" }),
    defineField({ name: "origin", type: "regionReference" }),
    defineField({ name: "farmers", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "farmer" }] })] }),
    defineField({ name: "flavor", type: "flavorProfile" }),
    defineField({ name: "usageNotes", type: "portableText" }),
    defineField({ name: "gallery", type: "array", of: [defineArrayMember({ type: "imageWithAlt" })] }),
    defineField({ name: "verification", type: "verificationFields", validation: (rule) => rule.required() }),
    defineField({ name: "seo", type: "seoFields" })
  ],
  preview: { select: { title: "editorialTitle", subtitle: "product.medusaProductId", media: "gallery.0" } }
});
