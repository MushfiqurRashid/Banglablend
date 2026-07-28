import { defineArrayMember, defineField, defineType } from "sanity";
import { languageField } from "../lib/fields";

export const giftEditorial = defineType({
  name: "giftEditorial",
  title: "Gift editorial",
  type: "document",
  fields: [
    defineField({ name: "product", type: "productReference", validation: (rule) => rule.required() }),
    languageField,
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "occasion", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "contents", type: "array", of: [{ type: "string" }], validation: (rule) => rule.required().min(1) }),
    defineField({ name: "story", type: "portableText" }),
    defineField({ name: "gallery", type: "array", of: [defineArrayMember({ type: "imageWithAlt" })] }),
    defineField({ name: "personalisationAvailable", type: "boolean", initialValue: true }),
    defineField({ name: "verification", type: "verificationFields", validation: (rule) => rule.required() }),
    defineField({ name: "seo", type: "seoFields" })
  ]
});
