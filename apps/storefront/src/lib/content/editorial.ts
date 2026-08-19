import "server-only";
import type { ComponentProps } from "react";
import type { PortableText } from "@portabletext/react";
import {
  launchArticles,
  type LaunchArticle,
  type StorySection,
  type StorySource,
} from "@/data/launch-articles";
import { launchRecipes, type LaunchRecipe } from "@/data/launch-recipes";
import { articles as previewArticles } from "./fallback-content";
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
  imageCredit?: string;
  author: string;
  body?: PortableValue;
  previewParagraphs?: string[];
  intro?: string[];
  sections?: StorySection[];
  sources?: StorySource[];
  editorialNote?: string;
  featured: boolean;
  sortOrder: number;
  verified: boolean;
}

export interface RecipeIngredient {
  amount?: number;
  displayAmount?: string;
  unit?: string;
  imperialAmount?: number;
  imperialUnit?: string;
  note?: string;
  name: string;
  banglaName?: string;
}

export interface RecipeIngredientGroup {
  title: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeStep {
  instruction: string;
  timerMinutes?: number;
}

export interface RecipeStepSection {
  title: string;
  steps: RecipeStep[];
}

export interface RecipeProduct {
  title: string;
  handle: string;
  image?: string;
  note?: string;
}

export interface EditorialRecipe {
  title: string;
  banglaTitle?: string;
  slug: string;
  excerpt: string;
  story?: string;
  region: string;
  category?: string;
  cuisine?: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  inactiveTime?: number;
  servings?: number;
  yield: string;
  difficulty: string;
  image: string;
  imageWide: string;
  imageSquare: string;
  imageAlt: string;
  imageCredit?: string;
  ingredients: RecipeIngredient[];
  ingredientGroups: RecipeIngredientGroup[];
  steps: RecipeStep[];
  stepSections: RecipeStepSection[];
  servingSuggestions: string[];
  tips: string[];
  storage?: string;
  safety?: string;
  dietaryTags: string[];
  relatedProducts: RecipeProduct[];
  author: string;
  publishedAt?: string;
  featured: boolean;
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
      featured: false,
      sortOrder: 999,
      verified: false,
    }));
}

function storyReadingTime(article: Pick<LaunchArticle, "intro" | "sections">) {
  const words = [
    ...article.intro,
    ...article.sections.flatMap((section) => [
      section.title,
      ...section.paragraphs,
      section.pullQuote ?? "",
      ...(section.highlights ?? []),
    ]),
  ]
    .join(" ")
    .trim()
    .split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 210));
}

function normalizeLaunchArticle(article: LaunchArticle): EditorialArticle {
  return {
    ...article,
    readingTime: storyReadingTime(article),
  };
}

const launchArticleLibrary = launchArticles.map(normalizeLaunchArticle);

function launchArticlePreview(category?: string) {
  return launchArticleLibrary.filter((article) => !category || article.categorySlug === category);
}

function normalizeLaunchRecipe(recipe: LaunchRecipe): EditorialRecipe {
  const ingredientGroups = recipe.ingredientGroups.map((group) => ({
    title: group.title,
    ingredients: group.ingredients.map((ingredient) => ({
      displayAmount: ingredient.amount,
      name: ingredient.name,
      note: ingredient.note,
    })),
  }));
  const stepSections = recipe.stepSections.map((section) => ({
    title: section.title,
    steps: section.steps,
  }));
  return {
    ...recipe,
    cuisine: "Bangladeshi",
    ingredients: ingredientGroups.flatMap((group) => group.ingredients),
    ingredientGroups,
    steps: stepSections.flatMap((section) => section.steps),
    stepSections,
    hasRegion: recipe.region !== "Bangladesh",
    hasProducts: recipe.relatedProducts.length > 0,
  };
}

const launchRecipeLibrary = launchRecipes.map(normalizeLaunchRecipe);

const ARTICLE_SELECT = `
  title, slug, summary, published_at, body, intro, story_sections, sources,
  editorial_note, hero_image, image_credit, featured, sort_order,
  author:authors!inner ( name ),
  category:journal_categories!inner ( title, slug )
` as const;

interface ArticleRow {
  title: string;
  slug: string;
  summary: string | null;
  published_at: string | null;
  body: PortableValue | null;
  intro: string[] | null;
  story_sections: StorySection[] | null;
  sources: StorySource[] | null;
  editorial_note: string | null;
  hero_image: ImageField;
  image_credit: string | null;
  featured: boolean | null;
  sort_order: number | null;
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
    readingTime: row.story_sections?.length
      ? storyReadingTime({ intro: row.intro ?? [], sections: row.story_sections })
      : Math.max(1, estimateReadingTime(row.body)),
    image: row.hero_image.url,
    imageAlt: row.hero_image.alt ?? "",
    imageCredit: row.image_credit ?? undefined,
    author: author?.name ?? "Bangla Blend Editorial",
    body: row.body ?? undefined,
    intro: row.intro ?? undefined,
    sections: row.story_sections ?? undefined,
    sources: row.sources ?? undefined,
    editorialNote: row.editorial_note ?? undefined,
    featured: row.featured ?? false,
    sortOrder: row.sort_order ?? 999,
    verified: true,
  };
}

export async function getArticles(category?: string): Promise<EditorialArticle[]> {
  const launch = launchArticlePreview(category);
  if (!contentClient) return launch.length ? launch : developmentFallbacksEnabled() ? articlePreview(category) : [];
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
    const approvedBySlug = new Map(approved.map((article) => [article.slug, article]));
    const launchSlugs = new Set(launch.map((article) => article.slug));
    return [
      ...launch.map((article) => approvedBySlug.get(article.slug) ?? article),
      ...approved.filter((article) => !launchSlugs.has(article.slug)),
    ].sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder || b.publishedAt.localeCompare(a.publishedAt));
  } catch (error) {
    logContentFetchFailure(error);
    return launch.length ? launch : developmentFallbacksEnabled() ? articlePreview(category) : [];
  }
}

export async function getArticle(category: string, slug: string): Promise<EditorialArticle | null> {
  const launchArticle = launchArticlePreview(category).find((article) => article.slug === slug) ?? null;
  if (!contentClient) return launchArticle ?? (developmentFallbacksEnabled() ? (articlePreview(category).find((a) => a.slug === slug) ?? null) : null);
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
    if (approved) return approved;
    if (launchArticle) return launchArticle;
    return developmentFallbacksEnabled() ? (articlePreview(category).find((article) => article.slug === slug) ?? null) : null;
  } catch (error) {
    logContentFetchFailure(error);
    return launchArticle ?? (developmentFallbacksEnabled() ? (articlePreview(category).find((a) => a.slug === slug) ?? null) : null);
  }
}

const RECIPE_SELECT = `
  title, bangla_title, slug, summary, story, category, cuisine, servings, prep_minutes,
  cook_minutes, total_minutes, inactive_minutes, yield_text, difficulty, library_sections,
  dietary_tags, serving_suggestions, tips, storage_notes, safety_notes, featured,
  published_at, author_display, hero_image, image_wide, image_square, image_credit,
  author:authors ( name ),
  region_division:geo_divisions!recipes_region_division_id_fkey ( title ),
  region_region:geo_regions!recipes_region_region_id_fkey ( title ),
  recipe_ingredients ( display_amount, amount, unit, imperial_amount, imperial_unit, note, group_label, group_sort_order, sort_order, ingredient:ingredients ( title, bangla_name ) ),
  recipe_steps ( instruction, timer_minutes, section_label, section_sort_order, sort_order ),
  recipe_related_products ( sort_order, product:products ( title, handle, thumbnail_url ) )
` as const;

interface RecipeRow {
  title: string;
  bangla_title: string | null;
  slug: string;
  summary: string | null;
  story: string | null;
  category: string | null;
  cuisine: string | null;
  servings: number;
  prep_minutes: number | null;
  cook_minutes: number | null;
  total_minutes: number | null;
  inactive_minutes: number | null;
  yield_text: string | null;
  difficulty: string | null;
  library_sections: string[] | null;
  dietary_tags: string[] | null;
  serving_suggestions: string[] | null;
  tips: string[] | null;
  storage_notes: string | null;
  safety_notes: string | null;
  featured: boolean | null;
  published_at: string | null;
  author_display: string | null;
  hero_image: ImageField;
  image_wide: ImageField;
  image_square: ImageField;
  image_credit: string | null;
  author: { name: string } | { name: string }[] | null;
  region_division: { title: string } | { title: string }[] | null;
  region_region: { title: string } | { title: string }[] | null;
  recipe_ingredients: Array<{
    display_amount: string | null;
    amount: number | null;
    unit: string | null;
    imperial_amount: number | null;
    imperial_unit: string | null;
    note: string | null;
    group_label: string | null;
    group_sort_order: number;
    sort_order: number;
    ingredient: { title: string; bangla_name: string | null } | { title: string; bangla_name: string | null }[] | null;
  }> | null;
  recipe_steps: Array<{ instruction: string; timer_minutes: number | null; section_label: string | null; section_sort_order: number; sort_order: number }> | null;
  recipe_related_products: Array<{
    sort_order: number;
    product: { title: string; handle: string; thumbnail_url: string | null } | { title: string; handle: string; thumbnail_url: string | null }[] | null;
  }> | null;
}

function normalizeRecipeRow(row: RecipeRow): EditorialRecipe | null {
  const sortedSteps = (row.recipe_steps ?? [])
    .slice()
    .sort((a, b) => a.section_sort_order - b.section_sort_order || a.sort_order - b.sort_order);
  const steps = sortedSteps
    .map((step) => ({ instruction: step.instruction, timerMinutes: step.timer_minutes ?? undefined }));
  const sortedIngredients = (row.recipe_ingredients ?? [])
    .slice()
    .sort((a, b) => a.group_sort_order - b.group_sort_order || a.sort_order - b.sort_order);
  const ingredients = sortedIngredients
    .map((entry) => {
      const ingredient = Array.isArray(entry.ingredient) ? entry.ingredient[0] : entry.ingredient;
      return {
        amount: entry.amount ?? undefined,
        displayAmount: entry.display_amount ?? undefined,
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
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  const ingredientGroups = [...new Set(sortedIngredients.map((entry) => entry.group_label ?? "Ingredients"))].map((title) => ({
    title,
    ingredients: sortedIngredients.filter((entry) => (entry.group_label ?? "Ingredients") === title).map((entry) => {
      const ingredient = Array.isArray(entry.ingredient) ? entry.ingredient[0] : entry.ingredient;
      return {
        amount: entry.amount ?? undefined,
        displayAmount: entry.display_amount ?? undefined,
        unit: entry.unit ?? undefined,
        imperialAmount: entry.imperial_amount ?? undefined,
        imperialUnit: entry.imperial_unit ?? undefined,
        note: entry.note ?? undefined,
        name: ingredient?.title ?? "",
        banglaName: ingredient?.bangla_name ?? undefined,
      };
    }),
  }));
  const stepSections = [...new Set(sortedSteps.map((step) => step.section_label ?? "Method"))].map((title) => ({
    title,
    steps: sortedSteps.filter((step) => (step.section_label ?? "Method") === title).map((step) => ({
      instruction: step.instruction,
      timerMinutes: step.timer_minutes ?? undefined,
    })),
  }));
  const relatedProducts = (row.recipe_related_products ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).flatMap((entry) => {
    const product = Array.isArray(entry.product) ? entry.product[0] : entry.product;
    return product ? [{ title: product.title, handle: product.handle, image: product.thumbnail_url ?? undefined }] : [];
  });
  return {
    title: row.title,
    banglaTitle: row.bangla_title ?? undefined,
    slug: row.slug,
    excerpt: row.summary,
    story: row.story ?? undefined,
    region: regionRegion?.title ?? regionDivision?.title ?? "Bangladesh",
    category: row.category ?? "Bangladeshi recipe",
    cuisine: row.cuisine ?? "Bangladeshi",
    prepTime: row.prep_minutes ?? 0,
    cookTime: row.cook_minutes ?? 0,
    totalTime: row.total_minutes ?? (row.prep_minutes ?? 0) + (row.cook_minutes ?? 0),
    inactiveTime: row.inactive_minutes ?? undefined,
    servings: row.servings,
    yield: row.yield_text ?? `${row.servings} servings`,
    difficulty: row.difficulty ?? "",
    image: row.hero_image.url,
    imageWide: row.image_wide?.url ?? row.hero_image.url,
    imageSquare: row.image_square?.url ?? row.hero_image.url,
    imageAlt: row.hero_image.alt ?? `Prepared ${row.title}`,
    imageCredit: row.image_credit ?? undefined,
    ingredients,
    ingredientGroups,
    steps,
    stepSections,
    servingSuggestions: row.serving_suggestions ?? [],
    tips: row.tips ?? [],
    storage: row.storage_notes ?? undefined,
    safety: row.safety_notes ?? undefined,
    dietaryTags: row.dietary_tags ?? [],
    relatedProducts,
    author: row.author_display ?? author?.name ?? "Bangla Blend Kitchen",
    publishedAt: row.published_at ?? undefined,
    featured: row.featured ?? false,
    hasRegion: Boolean(row.region_division),
    hasProducts: relatedProducts.length > 0,
    librarySections: row.library_sections ?? [],
    verified: true,
  };
}

export async function getRecipes(): Promise<EditorialRecipe[]> {
  if (!contentClient) return launchRecipeLibrary;
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
    const approvedBySlug = new Map(approved.map((recipe) => [recipe.slug, recipe]));
    const launchSlugs = new Set(launchRecipeLibrary.map((recipe) => recipe.slug));
    return [
      ...launchRecipeLibrary.map((recipe) => approvedBySlug.get(recipe.slug) ?? recipe),
      ...approved.filter((recipe) => !launchSlugs.has(recipe.slug)),
    ];
  } catch (error) {
    logContentFetchFailure(error);
    return launchRecipeLibrary;
  }
}

export async function getRecipe(slug: string): Promise<EditorialRecipe | null> {
  const launchRecipe = launchRecipeLibrary.find((recipe) => recipe.slug === slug) ?? null;
  if (!contentClient) return launchRecipe;
  try {
    const { data } = await contentClient
      .from("recipes")
      .select(RECIPE_SELECT)
      .eq("slug", slug)
      .eq("verification_status", "verified")
      .eq("verified", true)
      .maybeSingle();
    const approved = data ? normalizeRecipeRow(data as unknown as RecipeRow) : null;
    return approved ?? launchRecipe;
  } catch (error) {
    logContentFetchFailure(error);
    return launchRecipe;
  }
}
