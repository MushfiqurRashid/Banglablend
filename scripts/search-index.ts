// Rebuilds the Meilisearch index from Supabase (products + verified content). Meilisearch is a
// disposable projection -- this script is the only writer, and it can always be re-run from
// scratch. Replaces the old apps/medusa/src/scripts/search-index.ts, which additionally read from
// Sanity; content now lives in the same Supabase project as commerce data.
//
// Run with: node --experimental-strip-types scripts/search-index.ts (or plain `node` on Node 24+,
// which strips types without the flag).
import { createClient } from "@supabase/supabase-js";
import { Meilisearch } from "meilisearch";

const SEARCH_INDEX = "bangla_blend";
const synonyms: Record<string, string[]> = {
  mezban: ["mezbani", "মেজবান"],
  chattogram: ["chittagong", "চট্টগ্রাম"],
  hathazari: ["hathajari", "হাটহাজারী"],
  "shorisha ilish": ["mustard hilsa", "সরিষা ইলিশ"],
};

interface SearchDocument {
  id: string;
  type: "product" | "gift" | "recipe" | "division" | "region" | "ingredient" | "farmer" | "article";
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  eligibleMarkets?: string[];
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const meiliHost = requireEnv("MEILISEARCH_HOST");
  const meiliKey = requireEnv("MEILISEARCH_MASTER_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const meili = new Meilisearch({ host: meiliHost, apiKey: meiliKey });

  const documents: SearchDocument[] = [];

  const { data: products } = await supabase
    .from("products")
    .select("id, handle, title, description, thumbnail_url, eligible_markets, gift_type")
    .eq("status", "published")
    .eq("verified", true)
    .is("deleted_at", null);
  for (const product of products ?? []) {
    documents.push({
      id: `product_${product.id}`,
      type: product.gift_type ? "gift" : "product",
      title: product.title,
      slug: product.handle,
      excerpt: product.description ?? undefined,
      image: product.thumbnail_url ?? undefined,
      eligibleMarkets: product.eligible_markets ?? undefined,
    });
  }

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, slug, title, summary, hero_image")
    .eq("verification_status", "verified")
    .eq("verified", true);
  for (const recipe of recipes ?? []) {
    const heroImage = recipe.hero_image as { url?: string } | null;
    documents.push({ id: `recipe_${recipe.id}`, type: "recipe", title: recipe.title, slug: recipe.slug, excerpt: recipe.summary ?? undefined, image: heroImage?.url });
  }

  const { data: articles } = await supabase
    .from("journal_articles")
    .select("id, slug, title, summary, hero_image")
    .eq("verification_status", "verified")
    .eq("verified", true);
  for (const article of articles ?? []) {
    const heroImage = article.hero_image as { url?: string } | null;
    documents.push({ id: `article_${article.id}`, type: "article", title: article.title, slug: article.slug, excerpt: article.summary ?? undefined, image: heroImage?.url });
  }

  const { data: divisions } = await supabase
    .from("geo_divisions")
    .select("id, slug, title, summary, hero_image")
    .eq("verification_status", "verified")
    .eq("verified", true);
  for (const division of divisions ?? []) {
    const heroImage = division.hero_image as { url?: string } | null;
    documents.push({ id: `division_${division.id}`, type: "division", title: division.title, slug: division.slug, excerpt: division.summary ?? undefined, image: heroImage?.url });
  }

  const { data: regions } = await supabase
    .from("geo_regions")
    .select("id, slug, title, summary, hero_image")
    .eq("verification_status", "verified")
    .eq("verified", true);
  for (const region of regions ?? []) {
    const heroImage = region.hero_image as { url?: string } | null;
    documents.push({ id: `region_${region.id}`, type: "region", title: region.title, slug: region.slug, excerpt: region.summary ?? undefined, image: heroImage?.url });
  }

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id, slug, title, summary, hero_image")
    .eq("verification_status", "verified")
    .eq("verified", true);
  for (const ingredient of ingredients ?? []) {
    const heroImage = ingredient.hero_image as { url?: string } | null;
    documents.push({ id: `ingredient_${ingredient.id}`, type: "ingredient", title: ingredient.title, slug: ingredient.slug, excerpt: ingredient.summary ?? undefined, image: heroImage?.url });
  }

  const { data: farmers } = await supabase
    .from("farmers")
    .select("id, slug, display_name, summary, hero_image")
    .eq("verification_status", "verified")
    .eq("verified", true);
  for (const farmer of farmers ?? []) {
    const heroImage = farmer.hero_image as { url?: string } | null;
    documents.push({ id: `farmer_${farmer.id}`, type: "farmer", title: farmer.display_name, slug: farmer.slug, excerpt: farmer.summary ?? undefined, image: heroImage?.url });
  }

  const index = meili.index(SEARCH_INDEX);
  await index.updateSettings({
    searchableAttributes: ["title", "excerpt"],
    filterableAttributes: ["type", "eligibleMarkets"],
    synonyms,
  });
  await index.deleteAllDocuments();
  await index.addDocuments(documents, { primaryKey: "id" });

  console.log(`Indexed ${documents.length} documents into "${SEARCH_INDEX}".`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
