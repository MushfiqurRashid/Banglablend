import { defineField, defineType } from "sanity";

export const recipeStep = defineType({
  name: "recipeStep",
  title: "Recipe step",
  type: "object",
  fields: [
    defineField({ name: "instruction", type: "text", rows: 4, validation: (rule) => rule.required() }),
    defineField({ name: "image", type: "imageWithAlt" }),
    defineField({ name: "timerMinutes", title: "Optional timer (minutes)", type: "number", validation: (rule) => rule.min(1) })
  ],
  preview: { select: { title: "instruction" } }
});
