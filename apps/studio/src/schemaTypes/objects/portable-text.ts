import { defineArrayMember, defineField, defineType } from "sanity";

export const portableText = defineType({
  name: "portableText",
  title: "Rich text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading 2", value: "h2" },
        { title: "Heading 3", value: "h3" },
        { title: "Quote", value: "blockquote" }
      ],
      marks: { annotations: [defineField({ name: "link", title: "Link", type: "object", fields: [defineField({ name: "href", title: "URL", type: "url", validation: (rule) => rule.uri({ scheme: ["http", "https", "mailto", "tel"] }) })] })] }
    }),
    defineArrayMember({ type: "imageWithAlt" }),
    defineArrayMember({ type: "callToAction" })
  ]
});
