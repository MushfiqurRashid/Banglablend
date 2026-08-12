import "server-only";
import type { ComponentProps } from "react";
import type { PortableText } from "@portabletext/react";
import { contentClient, logContentFetchFailure } from "./client";

type PortableValue = ComponentProps<typeof PortableText>["value"];
type ImageField = { url?: string; alt?: string } | null;
type ActionField = { label?: string; href?: string } | null;

async function safely<T>(run: () => Promise<T | null>): Promise<T | null> {
  if (!contentClient) return null;
  try {
    return await run();
  } catch (error) {
    logContentFetchFailure(error);
    return null;
  }
}

// Rough parity with the old GROQ `round(length(pt::text(body)) / 1000) + 1` reading-time estimate.
function estimateReadingTime(body: PortableValue | null | undefined) {
  const blocks = Array.isArray(body) ? body : [];
  const charCount = blocks.reduce((total, block) => {
    const children = (block as { children?: Array<{ text?: string }> })?.children ?? [];
    return total + children.reduce((sum, child) => sum + (child.text?.length ?? 0), 0);
  }, 0);
  return Math.round(charCount / 1000) + 1;
}

export interface ApprovedHomepage {
  eyebrow?: string;
  headline?: string;
  introduction?: string;
  heroImage?: string;
  heroImageAlt?: string;
  primaryAction?: { label?: string; href?: string };
  secondaryAction?: { label?: string; href?: string };
}

interface HomepageRow {
  eyebrow: string | null;
  headline: string;
  introduction: string | null;
  hero_image: ImageField;
  primary_action: ActionField;
  secondary_action: ActionField;
}

export async function getHomepage(): Promise<ApprovedHomepage | null> {
  return safely(async () => {
    const { data } = await contentClient!
      .from("homepages")
      .select("eyebrow, headline, introduction, hero_image, primary_action, secondary_action")
      .eq("language", "en")
      .eq("verification_status", "verified")
      .eq("verified", true)
      .returns<HomepageRow[]>()
      .maybeSingle();
    if (!data) return null;
    return {
      eyebrow: data.eyebrow ?? undefined,
      headline: data.headline,
      introduction: data.introduction ?? undefined,
      heroImage: data.hero_image?.url,
      heroImageAlt: data.hero_image?.alt,
      primaryAction: data.primary_action ?? undefined,
      secondaryAction: data.secondary_action ?? undefined,
    };
  });
}

export interface ApprovedAnnouncement {
  message: string;
  link?: { label?: string; href?: string };
}

interface AnnouncementRow {
  message: string;
  link: ActionField;
  starts_at: string | null;
  ends_at: string | null;
}

export async function getAnnouncement(market: string): Promise<ApprovedAnnouncement | null> {
  return safely(async () => {
    const nowIso = new Date().toISOString();
    const { data } = await contentClient!
      .from("announcements")
      .select("message, link, starts_at, ends_at")
      .eq("language", "en")
      .eq("active", true)
      .in("market", ["all", market])
      .order("updated_at", { ascending: false })
      .limit(20)
      .returns<AnnouncementRow[]>();
    const current = (data ?? []).find(
      (row) => (!row.starts_at || row.starts_at <= nowIso) && (!row.ends_at || row.ends_at >= nowIso),
    );
    if (!current) return null;
    return { message: current.message, link: current.link ?? undefined };
  });
}

export interface ApprovedFaq {
  question: string;
  answer: PortableValue;
  category: string;
}

interface FaqItemRow {
  question: string;
  answer: PortableValue;
  sort_order: number;
  category: { title: string; sort_order: number } | { title: string; sort_order: number }[] | null;
}

export async function getFaqs(): Promise<ApprovedFaq[]> {
  const result = await safely(async () => {
    const { data } = await contentClient!
      .from("faq_items")
      .select("question, answer, sort_order, category:faq_categories!inner ( title, sort_order )")
      .eq("language", "en")
      .eq("published", true)
      .returns<FaqItemRow[]>();
    return (data ?? [])
      .slice()
      .sort((a, b) => {
        const categoryA = Array.isArray(a.category) ? a.category[0] : a.category;
        const categoryB = Array.isArray(b.category) ? b.category[0] : b.category;
        return (categoryA?.sort_order ?? 0) - (categoryB?.sort_order ?? 0) || a.sort_order - b.sort_order;
      })
      .map((row) => {
        const category = Array.isArray(row.category) ? row.category[0] : row.category;
        return { question: row.question, answer: row.answer, category: category?.title ?? "" };
      });
  });
  return result ?? [];
}

export interface ApprovedLegalPage {
  title: string;
  slug: string;
  introduction?: string;
  body?: PortableValue;
  effectiveDate: string;
  seo?: unknown;
}

interface LegalPageRow {
  title: string;
  slug: string;
  summary: string | null;
  body: PortableValue;
  effective_date: string;
  seo: unknown;
}

export async function getLegalPage(slug: string): Promise<ApprovedLegalPage | null> {
  return safely(async () => {
    const { data } = await contentClient!
      .from("legal_pages")
      .select("title, slug, summary, body, effective_date, seo")
      .eq("slug", slug)
      .eq("verification_status", "verified")
      .eq("verified", true)
      .eq("legal_approval_recorded", true)
      .returns<LegalPageRow[]>()
      .maybeSingle();
    if (!data) return null;
    return {
      title: data.title,
      slug: data.slug,
      introduction: data.summary ?? undefined,
      body: data.body,
      effectiveDate: data.effective_date,
      seo: data.seo,
    };
  });
}

export interface ApprovedStandardPage {
  title: string;
  slug: string;
  introduction?: string;
  body?: PortableValue;
  seo?: unknown;
}

interface StandardPageRow {
  title: string;
  slug: string;
  summary: string | null;
  body: PortableValue;
  seo: unknown;
}

export async function getStandardPage(slug: string): Promise<ApprovedStandardPage | null> {
  return safely(async () => {
    const { data } = await contentClient!
      .from("standard_pages")
      .select("title, slug, summary, body, seo")
      .eq("slug", slug)
      .eq("verification_status", "verified")
      .eq("verified", true)
      .returns<StandardPageRow[]>()
      .maybeSingle();
    if (!data) return null;
    return { title: data.title, slug: data.slug, introduction: data.summary ?? undefined, body: data.body, seo: data.seo };
  });
}

export interface ApprovedSitemapRoutes {
  recipes?: string[];
  articles?: { slug: string; category: string }[];
  legal?: string[];
  story?: string[];
}

interface SlugRow {
  slug: string;
}

interface ArticleSlugRow {
  slug: string;
  category: { slug: string } | { slug: string }[] | null;
}

export async function getApprovedSitemapRoutes(): Promise<ApprovedSitemapRoutes> {
  const result = await safely(async () => {
    const recipes = await contentClient!
      .from("recipes")
      .select("slug")
      .eq("verification_status", "verified")
      .eq("verified", true)
      .not("summary", "is", null);
    const articles = await contentClient!
      .from("journal_articles")
      .select("slug, category:journal_categories!inner ( slug )")
      .eq("verification_status", "verified")
      .eq("verified", true)
      .not("summary", "is", null)
      .not("published_at", "is", null);
    const legal = await contentClient!
      .from("legal_pages")
      .select("slug")
      .eq("verification_status", "verified")
      .eq("verified", true)
      .eq("legal_approval_recorded", true);
    const story = await contentClient!
      .from("standard_pages")
      .select("slug")
      .eq("verification_status", "verified")
      .eq("verified", true)
      .in("slug", ["about-bangla-blend", "our-philosophy", "our-impact", "meet-annapurna"]);
    const recipeRows = (recipes.data ?? []) as unknown as SlugRow[];
    const articleRows = (articles.data ?? []) as unknown as ArticleSlugRow[];
    const legalRows = (legal.data ?? []) as unknown as SlugRow[];
    const storyRows = (story.data ?? []) as unknown as SlugRow[];
    return {
      recipes: recipeRows.map((row) => row.slug),
      articles: articleRows.map((row) => {
        const category = Array.isArray(row.category) ? row.category[0] : row.category;
        return { slug: row.slug, category: category?.slug ?? "" };
      }),
      legal: legalRows.map((row) => row.slug),
      story: storyRows.map((row) => row.slug),
    };
  });
  return result ?? {};
}

export { estimateReadingTime };
