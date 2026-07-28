import "server-only";
import type { ComponentProps } from "react";
import type { PortableText } from "@portabletext/react";
import { articles as previewArticles, recipes as previewRecipes } from "./fallback-content";
import { sanityFetch } from "./client";
import { ARTICLE_LIST_QUERY, ARTICLE_QUERY, RECIPE_LIST_QUERY, RECIPE_QUERY } from "./queries";

type PortableValue = ComponentProps<typeof PortableText>["value"];

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

interface ArticleRecord {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  readingTime?: number;
  image?: string;
  imageAlt?: string;
  author?: { name?: string };
  category?: { title?: string; slug?: string };
  body?: PortableValue;
}

interface RecipeRecord extends Omit<EditorialRecipe, "verified" | "ingredients" | "steps" | "imageAlt" | "librarySections"> {
  imageAlt?: string;
  ingredients?: RecipeIngredient[];
  steps?: { instruction?: string; timerMinutes?: number }[];
  librarySections?: string[];
}

export function developmentFallbacksEnabled() {
  return process.env.NODE_ENV === "development" && process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true";
}

function normalizeArticle(record: ArticleRecord): EditorialArticle | null {
  if (!record.title || !record.slug || !record.excerpt || !record.publishedAt || !record.image || !record.category?.title || !record.category.slug) return null;
  return {
    title: record.title,
    slug: record.slug,
    category: record.category.title,
    categorySlug: record.category.slug,
    excerpt: record.excerpt,
    publishedAt: record.publishedAt,
    readingTime: Math.max(1, record.readingTime ?? 1),
    image: record.image,
    imageAlt: record.imageAlt ?? "",
    author: record.author?.name ?? "Bangla Blend Editorial",
    body: record.body,
    verified: true
  };
}

function articlePreview(category?: string): EditorialArticle[] {
  return previewArticles.filter((article) => !category || article.categorySlug === category).map((article) => ({
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
    verified: false
  }));
}

function normalizeRecipe(record: RecipeRecord): EditorialRecipe | null {
  const steps = record.steps?.filter((step): step is { instruction: string; timerMinutes?: number } => Boolean(step.instruction)) ?? [];
  if (!record.title || !record.slug || !record.excerpt || !record.image || !record.ingredients?.length || !steps.length) return null;
  return {
    ...record,
    imageAlt: record.imageAlt ?? `Prepared ${record.title}`,
    ingredients: record.ingredients,
    steps,
    librarySections: record.librarySections ?? [],
    verified: true
  };
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
    ingredients: recipe.ingredients.map((ingredient) => ({ name: ingredient.english, banglaName: ingredient.bangla, note: `${ingredient.metric} / ${ingredient.imperial}` })),
    steps: recipe.steps.map((instruction) => ({ instruction })),
    hasRegion: true,
    hasProducts: false,
    librarySections: recipe.slug === "shorisha-ilish" ? ["traditional"] : ["everyday-cooking"],
    verified: false
  }));
}

export async function getArticles(category?: string) {
  const records = await sanityFetch<ArticleRecord[]>(ARTICLE_LIST_QUERY, { category });
  const approved = records?.map(normalizeArticle).filter((article): article is EditorialArticle => Boolean(article)) ?? [];
  return approved.length || !developmentFallbacksEnabled() ? approved : articlePreview(category);
}

export async function getArticle(category: string, slug: string) {
  const record = await sanityFetch<ArticleRecord>(ARTICLE_QUERY, { category, slug });
  const approved = record ? normalizeArticle(record) : null;
  if (approved || !developmentFallbacksEnabled()) return approved;
  return articlePreview(category).find((article) => article.slug === slug) ?? null;
}

export async function getRecipes() {
  const records = await sanityFetch<RecipeRecord[]>(RECIPE_LIST_QUERY);
  const approved = records?.map(normalizeRecipe).filter((recipe): recipe is EditorialRecipe => Boolean(recipe)) ?? [];
  return approved.length || !developmentFallbacksEnabled() ? approved : recipePreview();
}

export async function getRecipe(slug: string) {
  const record = await sanityFetch<RecipeRecord>(RECIPE_QUERY, { slug });
  const approved = record ? normalizeRecipe(record) : null;
  if (approved || !developmentFallbacksEnabled()) return approved;
  return recipePreview().find((recipe) => recipe.slug === slug) ?? null;
}
