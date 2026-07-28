import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { getArticle } from "@/lib/sanity/editorial";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { siteConfig } from "@/config/site";
import "../../../editorial.css";

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const article = await getArticle(category, slug);
  return { title: article?.title ?? "Story not found", description: article?.excerpt, robots: { index: article?.verified === true, follow: article?.verified === true } };
}

export default async function DiscoverArticlePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const article = await getArticle(category, slug);
  if (!article) notFound();
  const formattedDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(new Date(article.publishedAt));
  const articleJsonLd = { "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.excerpt, datePublished: article.publishedAt, author: { "@type": article.author === "Bangla Blend Editorial" ? "Organization" : "Person", name: article.author }, publisher: { "@type": "Organization", name: siteConfig.name }, mainEntityOfPage: `${siteConfig.url}/discover-bangladesh/${article.categorySlug}/${article.slug}` };
  return <>
    <header className="page-hero"><PageContainer><Breadcrumbs items={[{ label: "Discover Bangladesh", href: "/discover-bangladesh" }, { label: article.category, href: `/discover-bangladesh/${article.categorySlug}` }, { label: article.title }]} /><span className="eyebrow">{article.category} · {article.readingTime} min read</span><h1>{article.title}</h1><p className="lead">{article.excerpt}</p><div className="editorial-hero-image"><Image src={article.image} alt={article.imageAlt} fill priority sizes="100vw" /></div></PageContainer></header>
    <Section><PageContainer>{!article.verified ? <p className="preview-note">Development preview · this story is not approved for publication.</p> : null}<div className="article-layout"><article className="article-body">{article.body ? <PortableText value={article.body} /> : article.previewParagraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article><aside className="article-aside"><span className="eyebrow">Article details</span><p>Published {formattedDate}</p><p>By {article.author}</p><p>Editorial claims are reviewed before publication and updated when better evidence becomes available.</p><Link className="text-link" href={`/discover-bangladesh/${article.categorySlug}`}>More {article.category.toLowerCase()}</Link></aside></div></PageContainer></Section>
    {article.verified ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }} /> : null}
  </>;
}
