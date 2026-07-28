import { defineField, defineType } from "sanity";

export const callToAction = defineType({
  name: "callToAction",
  title: "Call to action",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Label", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "href", title: "Destination", type: "string", validation: (rule) => rule.required().custom((value) => !value || value.startsWith("/") || value.startsWith("https://") ? true : "Use a site path or an HTTPS URL.") }),
    defineField({ name: "style", title: "Style", type: "string", options: { list: ["primary", "secondary", "text"] }, initialValue: "primary" })
  ]
});
