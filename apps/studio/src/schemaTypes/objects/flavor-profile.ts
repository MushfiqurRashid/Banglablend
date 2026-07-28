import { defineField, defineType } from "sanity";

export const flavorProfile = defineType({
  name: "flavorProfile",
  title: "Flavor profile",
  type: "object",
  fields: [
    defineField({ name: "heat", type: "number", validation: (rule) => rule.min(0).max(5) }),
    defineField({ name: "sweetness", type: "number", validation: (rule) => rule.min(0).max(5) }),
    defineField({ name: "aroma", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "pairings", type: "array", of: [{ type: "string" }] })
  ]
});
