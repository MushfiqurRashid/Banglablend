import { defineArrayMember, defineField, defineType } from "sanity";
import { publishableFields } from "../lib/fields";

export const recipe = defineType({
  name: "recipe",
  title: "Recipe",
  type: "document",
  fields: [
    ...publishableFields,
    defineField({ name: "author", type: "reference", to: [{ type: "author" }] }),
    defineField({ name: "region", type: "regionReference" }),
    defineField({ name: "servings", type: "number", validation: (rule) => rule.required().positive().integer() }),
    defineField({ name: "prepMinutes", type: "number", validation: (rule) => rule.min(0).integer() }),
    defineField({ name: "cookMinutes", type: "number", validation: (rule) => rule.min(0).integer() }),
    defineField({ name: "difficulty", type: "string", options: { list: ["easy", "moderate", "advanced"] } }),
    defineField({
      name: "librarySections",
      title: "Recipe library sections",
      type: "array",
      of: [{ type: "string" }],
      options: { list: [{ title: "Traditional", value: "traditional" }, { title: "Everyday cooking", value: "everyday-cooking" }] }
    }),
    defineField({ name: "ingredients", type: "array", of: [defineArrayMember({ type: "recipeIngredient" })], validation: (rule) => rule.required().min(1) }),
    defineField({ name: "steps", type: "array", of: [defineArrayMember({ type: "recipeStep" })], validation: (rule) => rule.required().min(1) }),
    defineField({ name: "relatedProducts", type: "array", of: [defineArrayMember({ type: "productReference" })] }),
    defineField({ name: "dietaryTags", type: "array", of: [{ type: "string" }] })
  ],
  preview: { select: { title: "title", subtitle: "verification.status", media: "heroImage" } }
});
