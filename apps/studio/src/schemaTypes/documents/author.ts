import { defineField, defineType } from "sanity";

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "name" }, validation: (rule) => rule.required() }),
    defineField({ name: "role", type: "string" }),
    defineField({ name: "portrait", type: "imageWithAlt" }),
    defineField({ name: "bio", type: "portableText" })
  ]
});
