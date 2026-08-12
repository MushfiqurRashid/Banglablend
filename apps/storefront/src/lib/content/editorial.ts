import "server-only";
import type { ComponentProps } from "react";
import type { PortableText } from "@portabletext/react";
import { articles as previewArticles, recipes as previewRecipes } from "./fallback-content";
import { contentClient, logContentFetchFailure } from "./client";
import { estimateReadingTime } from "./queries";

type PortableValue = ComponentProps<typeof PortableText>["value"];
type ImageField = { url?: string; alt?: string } | null;

export interface EditorialArticle {
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  excerpt: string;
  publishedAt: string;
  readingTime: number;
  image: string;
  imageAlt: string;
  author: string;
  body?: PortableValue;
  previewParagraphs?: string[];
  verified: boolean;
}

export interface RecipeIngredient {
  amount?: number;
  unit?: string;
  imperialAmount?: number;
  imperialUnit?: string;
  note?: string;
  name: string;
  banglaName?: string;
}

export interface EditorialRecipe {
  title: string;
  slug: string;
  excerpt: string;
  region: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  image: string;
  imageAlt: string;
  ingredients: RecipeIngredient[];
  steps: { instruction: string; timerMinutes?: number }[];
  hasRegion: boolean;
  hasProducts: boolean;
  librarySections: string[];
  verified: boolean;
}

export function developmentFallbacksEnabled() {
  return process.env.NODE_ENV === "development" && process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true";
}

function articlePreview(category?: string): EditorialArticle[] {
  return previewArticles
    .filter((article) => !category || article.categorySlug === category)
    .map((article) => ({
      title: article.title,
      slug: article.slug,
      category: article.category,
      categorySlug: article.categorySlug,
      excerpt: article.excerpt,
      publishedAt: article.date,
      readingTime: article.readingTime,
      image: article.image,
      imageAlt: "",
      author: "Bangla Blend Editorial",
      previewParagraphs: article.body,
      verified: false,
    }));
}

function recipePreview(): EditorialRecipe[] {
  return previewRecipes.map((recipe) => ({
    title: recipe.title,
    slug: recipe.slug,
    excerpt: recipe.excerpt,
    region: recipe.region,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    image: recipe.image,
    imageAlt: `Illustrative preview for ${recipe.title}`,
    ingredients: recipe.ingredients.map((ingredient) => ({
      name: ingredient.english,
      banglaName: ingredient.bangla,
      note: `${ingredient.metric} / ${ingredient.imperial}`,
    })),
    steps: recipe.steps.map((instruction) => ({ instruction })),
    hasRegion: true,
    hasProducts: false,
    librarySections: recipe.slug === "shorisha-ilish" ? ["traditional"] : ["everyday-cooking"],
    verified: false,
  }));
}

const ARTICLE_SELECT = `
  title, slug, summary, published_at, body,
  hero_image,
  author:authors!inner ( name ),
  category:journal_categories!inner ( title, slug )
` as const;

interface ArticleRow {
  title: string;
  slug: string;
  summary: string | null;
  published_at: string | null;
  body: PortableValue | null;
  hero_image: ImageField;
  author: { name: string } | { name: string }[] | null;
  category: { title: string; slug: string } | { title: string; slug: string }[] | null;
}

function normalizeArticleRow(row: ArticleRow): EditorialArticle | null {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  if (!row.summary || !row.hero_image?.url || !row.published_at || !category) return null;
  return {
    title: row.title,
    slug: row.slug,
    category: category.title,
    categorySlug: category.slug,
    excerpt: row.summary,
    publishedAt: row.published_at,
    readingTime: Math.max(1, estimateReadingTime(row.body)),
    image: row.hero_image.url,
    imageAlt: row.hero_image.alt ?? "",
    author: author?.name ?? "Bangla Blend Editorial",
    body: row.body ?? undefined,
    verified: true,
  };
}

export async function getArticles(category?: string): Promise<EditorialArticle[]> {
  if (!contentClient) return developmentFallbacksEnabled() ? articlePreview(category) : [];
  try {
    let request = contentClient
      .from("journal_articles")
      .select(ARTICLE_SELECT)
      .eq("verification_status", "verified")
      .eq("verified", true)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });
    if (category) request = request.eq("category.slug", category);
    const { data } = await request;
    const approved = (data ?? [])
      .map((row) => normalizeArticleRow(row as unknown as ArticleRow))
      .filter((article): article is EditorialArticle => Boolean(article));
    return approved.length || !developmentFallbacksEnabled() ? approved : articlePreview(category);
  } catch (error) {
    logContentFetchFailure(error);
    return developmentFallbacksEnabled() ? articlePreview(category) : [];
  }
}

export async function getArticle(category: string, slug: string): Promise<EditorialArticle | null> {
  if (!contentClient) return developmentFallbacksEnabled() ? (articlePreview(category).find((a) => a.slug === slug) ?? null) : null;
  try {
    const { data } = await contentClient
      .from("journal_articles")
      .select(ARTICLE_SELECT)
      .eq("slug", slug)
      .eq("category.slug", category)
      .eq("verification_status", "verified")
      .eq("verified", true)
      .maybeSingle();
    const approved = data ? normalizeArticleRow(data as unknown as ArticleRow) : null;
    if (approved || !developmentFallbacksEnabled()) return approved;
    return articlePreview(category).find((article) => article.slug === slug) ?? null;
  } catch (error) {
    logContentFetchFailure(error);
    return developmentFallbacksEnabled() ? (articlePreview(category).find((a) => a.slug === slug) ?? null) : null;
  }
}

const RECIPE_SELECT = `
  title, slug, summary, servings, prep_minutes, cook_minutes, difficulty, library_sections,
  hero_image,
  region_division:geo_divisions!recipes_region_division_id_fkey ( title ),
  region_region:geo_regions!recipes_region_region_id_fkey ( title ),
  recipe_ingredients ( amount, unit, imperial_amount, imperial_unit, note, sort_order, ingredient:ingredients ( title, bangla_name ) ),
  recipe_steps ( instruction, timer_minutes, sort_order ),
  recipe_related_products ( product_id )
` as const;

interface RecipeRow {
  title: string;
  slug: string;
  summary: string | null;
  servings: number;
  prep_minutes: number | null;
  cook_minutes: number | null;
  difficulty: string | null;
  library_sections: string[] | null;
  hero_image: ImageField;
  region_division: { title: string } | { title: string }[] | null;
  region_region: { title: string } | { title: string }[] | null;
  recipe_ingredients: Array<{
    amount: number | null;
    unit: string | null;
    imperial_amount: number | null;
    imperial_unit: string | null;
    note: string | null;
    sort_order: number;
    ingredient: { title: string; bangla_name: string | null } | { title: string; bangla_name: string | null }[] | null;
  }> | null;
  recipe_steps: Array<{ instruction: string; timer_minutes: number | null; sort_order: number }> | null;
  recipe_related_products: Array<{ product_id: string }> | null;
}

function normalizeRecipeRow(row: RecipeRow): EditorialRecipe | null {
  const steps = (row.recipe_steps ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((step) => ({ instruction: step.instruction, timerMinutes: step.timer_minutes ?? undefined }));
  const ingredients = (row.recipe_ingredients ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const ingredient = Array.isArray(entry.ingredient) ? entry.ingredient[0] : entry.ingredient;
      return {
        amount: entry.amount ?? undefined,
        unit: entry.unit ?? undefined,
        imperialAmount: entry.imperial_amount ?? undefined,
        imperialUnit: entry.imperial_unit ?? undefined,
        note: entry.note ?? undefined,
        name: ingredient?.title ?? "",
        banglaName: ingredient?.bangla_name ?? undefined,
      };
    });
  if (!row.summary || !row.hero_image?.url || !ingredients.length || !steps.length) return null;
  const regionRegion = Array.isArray(row.region_region) ? row.region_region[0] : row.region_region;
  const regionDivision = Array.isArray(row.region_division) ? row.region_division[0] : row.region_division;
  return {
    title: row.title,
    slug: row.slug,
    excerpt: row.summary,
    region: regionRegion?.title ?? regionDivision?.title ?? "Bangladesh",
    prepTime: row.prep_minutes ?? 0,
    cookTime: row.cook_minutes ?? 0,
    servings: row.servings,
    difficulty: row.difficulty ?? "",
    image: row.hero_image.url,
    imageAlt: row.hero_image.alt ?? `Prepared ${row.title}`,
    ingredients,
    steps,
    hasRegion: Boolean(row.region_division),
    hasProducts: (row.recipe_related_products?.length ?? 0) > 0,
    librarySections: row.library_sections ?? [],
    verified: true,
  };
}

export async function getRecipes(): Promise<EditorialRecipe[]> {
  if (!contentClient) return developmentFallbacksEnabled() ? recipePreview() : [];
  try {
    const { data } = await contentClient
      .from("recipes")
      .select(RECIPE_SELECT)
      .eq("verification_status", "verified")
      .eq("verified", true)
      .order("updated_at", { ascending: false });
    const approved = (data ?? [])
      .map((row) => normalizeRecipeRow(row as unknown as RecipeRow))
      .filter((recipe): recipe is EditorialRecipe => Boolean(recipe));
    return approved.length || !developmentFallbacksEnabled() ? approved : recipePreview();
  } catch (error) {
    logContentFetchFailure(error);
    return developmentFallbacksEnabled() ? recipePreview() : [];
  }
}

export async function getRecipe(slug: string): Promise<EditorialRecipe | null> {
  if (!contentClient) return developmentFallbacksEnabled() ? (recipePreview().find((r) => r.slug === slug) ?? null) : null;
  try {
    const { data } = await contentClient
      .from("recipes")
      .select(RECIPE_SELECT)
      .eq("slug", slug)
      .eq("verification_status", "verified")
      .eq("verified", true)
      .maybeSingle();
    const approved = data ? normalizeRecipeRow(data as unknown as RecipeRow) : null;
    if (approved || !developmentFallbacksEnabled()) return approved;
    return recipePreview().find((recipe) => recipe.slug === slug) ?? null;
  } catch (error) {
    logContentFetchFailure(error);
    return developmentFallbacksEnabled() ? (recipePreview().find((r) => r.slug === slug) ?? null) : null;
  }
}
