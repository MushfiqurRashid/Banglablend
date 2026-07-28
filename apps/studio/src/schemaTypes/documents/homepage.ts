import { defineArrayMember, defineField, defineType } from "sanity";
import { singletonFields } from "../lib/fields";

export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  fields: [
    ...singletonFields,
    defineField({ name: "eyebrow", type: "string" }),
    defineField({ name: "headline", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "introduction", type: "text", rows: 4 }),
    defineField({ name: "heroImage", type: "imageWithAlt" }),
    defineField({ name: "verification", type: "verificationFields", validation: (rule) => rule.required() }),
    defineField({ name: "primaryAction", type: "callToAction" }),
    defineField({ name: "secondaryAction", type: "callToAction" }),
    defineField({ name: "featuredProducts", type: "array", of: [defineArrayMember({ type: "productReference" })], validation: (rule) => rule.max(8) }),
    defineField({ name: "featuredRegions", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "region" }] })] }),
    defineField({ name: "featuredRecipes", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "recipe" }] })] })
  ],
  preview: { select: { title: "title", subtitle: "language" } }
});
