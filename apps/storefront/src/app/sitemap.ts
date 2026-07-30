import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { journalCategories } from "@/lib/sanity/fallback-content";
import { sanityFetch } from "@/lib/sanity/client";
import { APPROVED_SITEMAP_QUERY } from "@/lib/sanity/queries";

interface ApprovedRoutes {
  recipes?: string[];
  articles?: { slug: string; category: string }[];
  legal?: string[];
  story?: string[];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "", "/shop", "/shop/all", "/shop/originals", "/shop/reserve", "/shop/pantry", "/shop/tea-wellness", "/shop/lifestyle-accessories", "/shop/best-sellers", "/shop/new-arrivals",
    "/gifts", "/gifts/gift-sets", "/gifts/regional-gifts", "/gifts/corporate",
    "/discover-bangladesh", ...journalCategories.map((category) => `/discover-bangladesh/${category.slug}`),
    "/recipes", "/recipes/by-region", "/recipes/by-product", "/recipes/traditional", "/recipes/everyday-cooking",
    "/our-story", "/about-bangla-blend", "/wholesale", "/faq", "/contact"
  ];
  const approved = await sanityFetch<ApprovedRoutes>(APPROVED_SITEMAP_QUERY);
  const contentRoutes = [
    ...(approved?.recipes ?? []).map((slug) => `/recipes/${slug}`),
    ...(approved?.articles ?? []).filter((article) => article.slug && article.category).map((article) => `/discover-bangladesh/${article.category}/${article.slug}`),
    ...(approved?.story ?? []).map((slug) => `/our-story/${slug}`),
    ...(approved?.legal ?? []).map((slug) => `/legal/${slug}`)
  ];
  return [...new Set([...staticRoutes, ...contentRoutes])].map((route) => ({ url: `${siteConfig.url}${route}`, lastModified: new Date(), changeFrequency: route === "" ? "weekly" : "monthly", priority: route === "" ? 1 : 0.7 }));
}
