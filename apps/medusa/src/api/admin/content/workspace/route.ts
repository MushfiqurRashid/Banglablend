import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  return res.json({
    actor_id: req.auth_context.actor_id,
    studio: {
      configured: Boolean(process.env.SANITY_PROJECT_ID),
      url: process.env.SANITY_STUDIO_URL ?? "http://localhost:3333",
    },
    homepages: [
      {
        title: "Homepage: English",
        description: "Hero, featured content, discovery sections, campaigns, and English copy.",
        document_id: "homepage-en",
        schema_type: "homepage",
      },
      {
        title: "Homepage: Bangla",
        description: "Bangla homepage copy and localized editorial sections.",
        document_id: "homepage-bn",
        schema_type: "homepage",
      },
    ],
    pages: [
      {
        title: "Standard Pages",
        description: "Our story, standards, sourcing, help, and other reusable website pages.",
        schema_type: "standardPage",
      },
      {
        title: "Legal Pages",
        description: "Privacy, terms, shipping, returns, and other governed policy content.",
        schema_type: "legalPage",
      },
      {
        title: "FAQs",
        description: "Customer questions, answers, and FAQ categories.",
        schema_type: "faqItem",
      },
    ],
    library: [
      {
        title: "Recipes",
        description: "Ingredients, steps, related products, photography, and verification state.",
        schema_type: "recipe",
      },
      {
        title: "Journal",
        description: "Articles, authors, categories, hero media, and publishing metadata.",
        schema_type: "journalArticle",
      },
      {
        title: "Commerce Storytelling",
        description: "Product editorial, gifting narratives, and sourcing stories.",
        schema_type: "productEditorial",
      },
      {
        title: "Places & Provenance",
        description: "Divisions, regions, ingredients, farmers, and producers.",
        schema_type: "region",
      },
      {
        title: "Navigation & Campaigns",
        description: "Menus, announcements, and promotional banners.",
        schema_type: "navigation",
      },
      {
        title: "Media & Reusable Content",
        description: "Browse every Sanity document and its attached image assets.",
        schema_type: null,
      },
    ],
  });
}
