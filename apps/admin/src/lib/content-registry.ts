// Registry-driven content editor. Rather than 21 bespoke pages for the 21 content document types
// (see supabase/migrations/2026...content_*.sql), one generic list/create/edit engine reads this
// registry and renders itself -- the only way to cover the full content model without spending
// disproportionate time on repetitive CRUD screens. Complex nested collections (recipe
// ingredients/steps, and the various *_farmers/*_related_products join tables) are intentionally
// out of scope for this generic editor and would need bespoke UI as a follow-up.

export type FieldKind = "text" | "textarea" | "richtext" | "boolean" | "select" | "number" | "date" | "foreignKey" | "array" | "json";

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  foreignTable?: string;
  foreignLabelColumn?: string;
  helpText?: string;
}

export interface ContentTypeDef {
  table: string;
  label: string;
  area: "content" | "pages" | "homepage";
  hasVerification: boolean;
  hasLanguage: boolean;
  titleColumn: string;
  slugColumn?: string;
  fields: FieldDef[];
  singleton?: boolean;
}

const verificationFields: FieldDef[] = [
  { name: "verification_status", label: "Verification status", kind: "select", options: ["draft", "in_review", "verified", "archived"], required: true },
  { name: "verified", label: "Verified (must match status = verified)", kind: "boolean" },
  { name: "source_notes", label: "Source notes (internal only)", kind: "textarea", helpText: "Citations, interview notes, provenance evidence. Never shown publicly." },
];

const languageField: FieldDef = { name: "language", label: "Language", kind: "select", options: ["en", "bn"], required: true };

const publishableFields = (): FieldDef[] => [
  { name: "title", label: "Title", kind: "text", required: true },
  { name: "slug", label: "Slug", kind: "text", required: true },
  languageField,
  { name: "summary", label: "Summary", kind: "textarea" },
  { name: "hero_image", label: "Hero image (JSON: url, alt)", kind: "json" },
  { name: "body", label: "Body", kind: "richtext", helpText: "Write normally. Leave a blank line between paragraphs." },
  ...verificationFields,
  { name: "seo", label: "SEO (JSON)", kind: "json" },
];

export const contentRegistry: ContentTypeDef[] = [
  { table: "authors", label: "Authors", area: "content", hasVerification: false, hasLanguage: false, titleColumn: "name", slugColumn: "slug", fields: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "slug", label: "Slug", kind: "text", required: true },
    { name: "role", label: "Role", kind: "text" },
    { name: "portrait", label: "Portrait (JSON: url, alt)", kind: "json" },
    { name: "bio", label: "Bio", kind: "richtext", helpText: "Leave a blank line between paragraphs." },
  ]},
  { table: "journal_categories", label: "Journal Categories", area: "content", hasVerification: false, hasLanguage: false, titleColumn: "title", slugColumn: "slug", fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "slug", label: "Slug", kind: "text", required: true },
    { name: "description", label: "Description", kind: "textarea" },
  ]},
  { table: "faq_categories", label: "FAQ Categories", area: "content", hasVerification: false, hasLanguage: false, titleColumn: "title", slugColumn: "slug", fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "slug", label: "Slug", kind: "text", required: true },
    { name: "sort_order", label: "Sort order", kind: "number" },
  ]},
  { table: "faq_items", label: "FAQ Items", area: "content", hasVerification: false, hasLanguage: true, titleColumn: "question", fields: [
    { name: "question", label: "Question", kind: "text", required: true },
    languageField,
    { name: "category_id", label: "Category", kind: "foreignKey", foreignTable: "faq_categories", foreignLabelColumn: "title", required: true },
    { name: "answer", label: "Answer", kind: "richtext", required: true, helpText: "Leave a blank line between paragraphs." },
    { name: "sort_order", label: "Sort order", kind: "number" },
    { name: "published", label: "Published", kind: "boolean" },
  ]},
  { table: "geo_divisions", label: "Divisions", area: "content", hasVerification: true, hasLanguage: true, titleColumn: "title", slugColumn: "slug", fields: [
    ...publishableFields(),
    { name: "bangla_name", label: "Bangla name", kind: "text" },
    { name: "map_coordinates", label: "Map coordinates (JSON: lat, lng)", kind: "json" },
    { name: "culinary_notes", label: "Culinary notes (comma separated)", kind: "array" },
  ]},
  { table: "geo_regions", label: "Regions", area: "content", hasVerification: true, hasLanguage: true, titleColumn: "title", slugColumn: "slug", fields: [
    ...publishableFields(),
    { name: "division_id", label: "Division", kind: "foreignKey", foreignTable: "geo_divisions", foreignLabelColumn: "title", required: true },
    { name: "coordinates", label: "Coordinates (JSON: lat, lng)", kind: "json" },
  ]},
  { table: "ingredients", label: "Ingredients", area: "content", hasVerification: true, hasLanguage: true, titleColumn: "title", slugColumn: "slug", fields: [
    ...publishableFields(),
    { name: "bangla_name", label: "Bangla name", kind: "text" },
    { name: "flavor", label: "Flavor profile (JSON)", kind: "json" },
    { name: "origin_division_id", label: "Origin division", kind: "foreignKey", foreignTable: "geo_divisions", foreignLabelColumn: "title" },
    { name: "origin_region_id", label: "Origin region", kind: "foreignKey", foreignTable: "geo_regions", foreignLabelColumn: "title" },
    { name: "allergen_statement", label: "Allergen statement", kind: "textarea" },
  ]},
  { table: "farmers", label: "Farmers", area: "content", hasVerification: true, hasLanguage: true, titleColumn: "title", slugColumn: "slug", fields: [
    ...publishableFields(),
    { name: "display_name", label: "Display name", kind: "text", required: true },
    { name: "location_division_id", label: "Division", kind: "foreignKey", foreignTable: "geo_divisions", foreignLabelColumn: "title" },
    { name: "location_region_id", label: "Region", kind: "foreignKey", foreignTable: "geo_regions", foreignLabelColumn: "title" },
    { name: "consent_recorded", label: "Publication consent recorded", kind: "boolean", required: true },
    { name: "consent_notes", label: "Consent notes", kind: "textarea" },
  ]},
  { table: "producers", label: "Producers", area: "content", hasVerification: true, hasLanguage: true, titleColumn: "title", slugColumn: "slug", fields: [
    ...publishableFields(),
    { name: "display_name", label: "Display name", kind: "text", required: true },
    { name: "location_division_id", label: "Division", kind: "foreignKey", foreignTable: "geo_divisions", foreignLabelColumn: "title" },
    { name: "location_region_id", label: "Region", kind: "foreignKey", foreignTable: "geo_regions", foreignLabelColumn: "title" },
    { name: "certifications", label: "Certifications (comma separated)", kind: "array" },
    { name: "consent_recorded", label: "Publication consent recorded", kind: "boolean" },
  ]},
  { table: "sourcing_stories", label: "Sourcing Stories", area: "content", hasVerification: true, hasLanguage: true, titleColumn: "title", slugColumn: "slug", fields: [
    ...publishableFields(),
    { name: "ingredient_id", label: "Ingredient", kind: "foreignKey", foreignTable: "ingredients", foreignLabelColumn: "title" },
    { name: "place_division_id", label: "Division", kind: "foreignKey", foreignTable: "geo_divisions", foreignLabelColumn: "title" },
    { name: "place_region_id", label: "Region", kind: "foreignKey", foreignTable: "geo_regions", foreignLabelColumn: "title" },
    { name: "harvest_window", label: "Harvest window", kind: "text" },
    { name: "traceability_notes", label: "Traceability notes", kind: "textarea" },
  ]},
  { table: "product_editorials", label: "Product Editorials", area: "content", hasVerification: true, hasLanguage: true, titleColumn: "editorial_title", fields: [
    { name: "product_id", label: "Product", kind: "foreignKey", foreignTable: "products", foreignLabelColumn: "title", required: true },
    languageField,
    { name: "editorial_title", label: "Editorial title", kind: "text", required: true },
    { name: "short_story", label: "Short story", kind: "textarea" },
    { name: "story", label: "Story", kind: "richtext", helpText: "Leave a blank line between paragraphs." },
    { name: "origin_division_id", label: "Origin division", kind: "foreignKey", foreignTable: "geo_divisions", foreignLabelColumn: "title" },
    { name: "origin_region_id", label: "Origin region", kind: "foreignKey", foreignTable: "geo_regions", foreignLabelColumn: "title" },
    { name: "flavor", label: "Flavor profile (JSON)", kind: "json" },
    { name: "usage_notes", label: "Usage notes", kind: "richtext", helpText: "Leave a blank line between paragraphs." },
    { name: "gallery", label: "Gallery (JSON array)", kind: "json" },
    ...verificationFields,
    { name: "seo", label: "SEO (JSON)", kind: "json" },
  ]},
  { table: "gift_editorials", label: "Gift Editorials", area: "content", hasVerification: true, hasLanguage: true, titleColumn: "title", fields: [
    { name: "product_id", label: "Product", kind: "foreignKey", foreignTable: "products", foreignLabelColumn: "title", required: true },
    languageField,
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "occasion", label: "Occasions (comma separated)", kind: "array" },
    { name: "contents", label: "Box contents (comma separated)", kind: "array", required: true },
    { name: "story", label: "Story", kind: "richtext", helpText: "Leave a blank line between paragraphs." },
    { name: "gallery", label: "Gallery (JSON array)", kind: "json" },
    { name: "personalisation_available", label: "Personalisation available", kind: "boolean" },
    ...verificationFields,
    { name: "seo", label: "SEO (JSON)", kind: "json" },
  ]},
  { table: "recipes", label: "Recipes", area: "content", hasVerification: true, hasLanguage: true, titleColumn: "title", slugColumn: "slug", fields: [
    ...publishableFields(),
    { name: "author_id", label: "Author", kind: "foreignKey", foreignTable: "authors", foreignLabelColumn: "name" },
    { name: "region_division_id", label: "Region division", kind: "foreignKey", foreignTable: "geo_divisions", foreignLabelColumn: "title" },
    { name: "region_region_id", label: "Region", kind: "foreignKey", foreignTable: "geo_regions", foreignLabelColumn: "title" },
    { name: "servings", label: "Servings", kind: "number", required: true },
    { name: "prep_minutes", label: "Prep minutes", kind: "number" },
    { name: "cook_minutes", label: "Cook minutes", kind: "number" },
    { name: "difficulty", label: "Difficulty", kind: "select", options: ["easy", "moderate", "advanced"] },
    { name: "library_sections", label: "Library sections (comma separated)", kind: "array", helpText: "traditional, everyday-cooking" },
    { name: "dietary_tags", label: "Dietary tags (comma separated)", kind: "array" },
  ]},
  { table: "journal_articles", label: "Journal Articles", area: "content", hasVerification: true, hasLanguage: true, titleColumn: "title", slugColumn: "slug", fields: [
    ...publishableFields(),
    { name: "author_id", label: "Author", kind: "foreignKey", foreignTable: "authors", foreignLabelColumn: "name", required: true },
    { name: "category_id", label: "Category", kind: "foreignKey", foreignTable: "journal_categories", foreignLabelColumn: "title", required: true },
    { name: "published_at", label: "Published at", kind: "date" },
  ]},
  { table: "standard_pages", label: "Standard Pages", area: "pages", hasVerification: true, hasLanguage: true, titleColumn: "title", slugColumn: "slug", fields: publishableFields() },
  { table: "legal_pages", label: "Legal Pages", area: "pages", hasVerification: true, hasLanguage: true, titleColumn: "title", slugColumn: "slug", fields: [
    ...publishableFields(),
    { name: "effective_date", label: "Effective date", kind: "date", required: true },
    { name: "review_owner", label: "Review owner", kind: "text" },
    { name: "legal_approval_recorded", label: "Legal approval recorded", kind: "boolean", required: true },
  ]},
  { table: "homepages", label: "Homepages", area: "homepage", hasVerification: true, hasLanguage: true, titleColumn: "title", singleton: true, fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    languageField,
    { name: "seo", label: "SEO (JSON)", kind: "json" },
    { name: "eyebrow", label: "Eyebrow", kind: "text" },
    { name: "headline", label: "Headline", kind: "text", required: true },
    { name: "introduction", label: "Introduction", kind: "textarea" },
    { name: "hero_image", label: "Hero image (JSON: url, alt)", kind: "json" },
    ...verificationFields,
    { name: "primary_action", label: "Primary action (JSON: label, href)", kind: "json" },
    { name: "secondary_action", label: "Secondary action (JSON: label, href)", kind: "json" },
  ]},
  { table: "navigations", label: "Navigation Menus", area: "homepage", hasVerification: false, hasLanguage: true, titleColumn: "title", fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    languageField,
    { name: "location", label: "Location", kind: "select", options: ["header", "footer_shop", "footer_explore", "footer_help"], required: true },
    { name: "items", label: "Items (JSON array of {label, href, style})", kind: "json", required: true },
  ]},
  { table: "announcements", label: "Announcements", area: "homepage", hasVerification: false, hasLanguage: true, titleColumn: "title", fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    languageField,
    { name: "message", label: "Message", kind: "text", required: true },
    { name: "link", label: "Link (JSON: label, href)", kind: "json" },
    { name: "market", label: "Market", kind: "select", options: ["all", "bd", "gb", "us"] },
    { name: "starts_at", label: "Starts at", kind: "date" },
    { name: "ends_at", label: "Ends at", kind: "date" },
    { name: "active", label: "Active", kind: "boolean" },
  ]},
  { table: "promotion_banners", label: "Promotion Banners", area: "homepage", hasVerification: false, hasLanguage: true, titleColumn: "title", fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    languageField,
    { name: "message", label: "Message", kind: "textarea" },
    { name: "image", label: "Image (JSON: url, alt)", kind: "json" },
    { name: "action", label: "Action (JSON: label, href)", kind: "json" },
    { name: "market", label: "Market", kind: "select", options: ["all", "bd", "gb", "us"] },
    { name: "active", label: "Active", kind: "boolean" },
  ]},
  { table: "homepage_featured_products", label: "Homepage Featured Products", area: "homepage", hasVerification: false, hasLanguage: false, titleColumn: "product_id", fields: [
    { name: "homepage_id", label: "Homepage", kind: "foreignKey", foreignTable: "homepages", foreignLabelColumn: "title", required: true },
    { name: "product_id", label: "Product", kind: "foreignKey", foreignTable: "products", foreignLabelColumn: "title", required: true },
    { name: "sort_order", label: "Sort order", kind: "number" },
  ]},
];

export function getContentType(table: string) {
  return contentRegistry.find((entry) => entry.table === table);
}
