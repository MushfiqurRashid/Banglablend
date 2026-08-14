import "server-only";
import type { MarketCode, SearchDocument } from "@bangla-blend/types";
import { createSupabasePublicClient } from "@bangla-blend/supabase-client";
import { getStoreProducts } from "@/lib/commerce/server";

const SEARCH_LIMIT = 24;
const synonymGroups = [
  ["mezban", "mezbani"],
  ["chattogram", "chittagong"],
  ["hathazari", "hathajari"],
  ["shorisha ilish", "mustard hilsa"],
] as const;

interface ContentRow {
  id: string;
  slug: string;
  title?: string;
  display_name?: string;
  summary?: string | null;
  hero_image?: { url?: string } | null;
}

function searchTerms(query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  const group = synonymGroups.find((terms) => (terms as readonly string[]).includes(normalized));
  return group ? [...new Set([normalized, ...group])] : [normalized];
}

function matches(document: SearchDocument, terms: string[]) {
  const searchable = [document.title, document.excerpt]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  return terms.some((term) => searchable.includes(term));
}

function contentDocument(type: SearchDocument["type"], row: ContentRow): SearchDocument | null {
  const title = row.title ?? row.display_name;
  if (!title) return null;
  return {
    id: `${type}_${row.id}`,
    type,
    title,
    slug: row.slug,
    excerpt: row.summary ?? undefined,
    image: row.hero_image?.url,
  };
}

async function loadContentRows(
  table:
    "recipes" | "journal_articles" | "geo_divisions" | "geo_regions" | "ingredients" | "farmers",
  select: string,
) {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq("verification_status", "verified")
    .eq("verified", true)
    .limit(200);
  if (error) return [];
  return (data ?? []) as unknown as ContentRow[];
}

export async function searchStorefront(query: string, market: MarketCode) {
  const terms = searchTerms(query);
  const [products, recipes, articles, divisions, regions, ingredients, farmers] = await Promise.all(
    [
      getStoreProducts("", market),
      loadContentRows("recipes", "id, slug, title, summary, hero_image"),
      loadContentRows("journal_articles", "id, slug, title, summary, hero_image"),
      loadContentRows("geo_divisions", "id, slug, title, summary, hero_image"),
      loadContentRows("geo_regions", "id, slug, title, summary, hero_image"),
      loadContentRows("ingredients", "id, slug, title, summary, hero_image"),
      loadContentRows("farmers", "id, slug, display_name, summary, hero_image"),
    ],
  );

  const documents: SearchDocument[] = products.map((product) => ({
    id: `product_${product.id}`,
    type: product.giftType ? "gift" : "product",
    title: product.title,
    slug: product.handle,
    excerpt: [product.subtitle, product.description, product.region, product.ingredients]
      .filter(Boolean)
      .join(" "),
    image: product.thumbnail,
    eligibleMarkets: product.eligibleMarkets,
  }));

  const contentSources: Array<[SearchDocument["type"], ContentRow[]]> = [
    ["recipe", recipes],
    ["article", articles],
    ["division", divisions],
    ["region", regions],
    ["ingredient", ingredients],
    ["farmer", farmers],
  ];
  for (const [type, rows] of contentSources) {
    for (const row of rows) {
      const document = contentDocument(type, row);
      if (document) documents.push(document);
    }
  }

  const hits = documents.filter((document) => matches(document, terms)).slice(0, SEARCH_LIMIT);
  return { hits, estimatedTotalHits: hits.length, source: "supabase" as const };
}
