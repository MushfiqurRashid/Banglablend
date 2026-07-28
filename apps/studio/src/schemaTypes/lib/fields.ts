import { defineField } from "sanity";

export const languageField = defineField({
  name: "language",
  title: "Language",
  type: "string",
  options: { list: [{ title: "English", value: "en" }, { title: "Bangla", value: "bn" }] },
  initialValue: "en",
  validation: (rule) => rule.required()
});

export const publishableFields = [
  defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
  defineField({ name: "slug", type: "slug", options: { source: "title", maxLength: 96 }, validation: (rule) => rule.required() }),
  languageField,
  defineField({ name: "summary", type: "text", rows: 3, validation: (rule) => rule.max(260) }),
  defineField({ name: "heroImage", type: "imageWithAlt" }),
  defineField({ name: "body", type: "portableText" }),
  defineField({ name: "verification", type: "verificationFields", validation: (rule) => rule.required() }),
  defineField({ name: "seo", type: "seoFields" })
];

export const singletonFields = [
  languageField,
  defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
  defineField({ name: "seo", type: "seoFields" })
];
