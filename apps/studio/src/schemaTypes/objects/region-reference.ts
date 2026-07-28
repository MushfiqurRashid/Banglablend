import { defineField, defineType } from "sanity";

export const regionReference = defineType({
  name: "regionReference",
  title: "Place",
  type: "object",
  fields: [
    defineField({ name: "division", type: "reference", to: [{ type: "division" }], validation: (rule) => rule.required() }),
    defineField({ name: "region", type: "reference", to: [{ type: "region" }] })
  ]
});
