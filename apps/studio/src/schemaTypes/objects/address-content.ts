import { defineField, defineType } from "sanity";

export const addressContent = defineType({
  name: "addressContent",
  title: "Address",
  type: "object",
  fields: [
    defineField({ name: "line1", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "line2", type: "string" }),
    defineField({ name: "city", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "districtOrState", title: "District or state", type: "string" }),
    defineField({ name: "postalCode", type: "string" }),
    defineField({ name: "countryCode", type: "string", validation: (rule) => rule.required().length(2) })
  ]
});
