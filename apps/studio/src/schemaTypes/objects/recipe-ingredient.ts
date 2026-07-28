import { defineField, defineType } from "sanity";

export const recipeIngredient = defineType({
  name: "recipeIngredient",
  title: "Recipe ingredient",
  type: "object",
  fields: [
    defineField({ name: "ingredient", type: "reference", to: [{ type: "ingredient" }], validation: (rule) => rule.required() }),
    defineField({ name: "amount", type: "number", validation: (rule) => rule.positive() }),
    defineField({ name: "unit", type: "string" }),
    defineField({ name: "imperialAmount", title: "Imperial amount", type: "number", validation: (rule) => rule.positive() }),
    defineField({ name: "imperialUnit", title: "Imperial unit", type: "string" }),
    defineField({ name: "note", type: "string" })
  ],
  preview: { select: { title: "ingredient.name", amount: "amount", unit: "unit" }, prepare: ({ title, amount, unit }) => ({ title, subtitle: [amount, unit].filter(Boolean).join(" ") }) }
});
