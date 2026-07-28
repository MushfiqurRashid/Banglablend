import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "brandName", type: "string", initialValue: "Bangla Blend", validation: (rule) => rule.required() }),
    defineField({ name: "defaultSeo", type: "seoFields" }),
    defineField({ name: "supportEmail", type: "string", validation: (rule) => rule.email() }),
    defineField({ name: "supportPhone", type: "string" }),
    defineField({ name: "address", type: "addressContent" }),
    defineField({ name: "socialLinks", type: "array", of: [{ type: "object", fields: [defineField({ name: "label", type: "string" }), defineField({ name: "url", type: "url" })] }] }),
    defineField({ name: "internationalCheckoutEnabled", type: "boolean", initialValue: false, description: "Operational switch. The storefront also requires its matching server environment flag." })
  ],
  preview: { prepare: () => ({ title: "Site settings" }) }
});
