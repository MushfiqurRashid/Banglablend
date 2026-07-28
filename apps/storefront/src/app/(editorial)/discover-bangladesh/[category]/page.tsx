import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { journalCategories } from "@/lib/sanity/fallback-content";
import { getArticles } from "@/lib/sanity/editorial";
import { ArticleCard } from "@/components/editorial/article-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import "../../editorial.css";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = journalCategories.find((item) => item.slug === slug);
  return { title: category?.title ?? "Discover Bangladesh", description: category?.description, robots: { index: Boolean(category), follow: Boolean(category) } };
}

export default async function DiscoverCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = journalCategories.find((item) => item.slug === slug);
  if (!category) {
    const article = (await getArticles()).find((item) => item.slug === slug);
    if (article) redirect(`/discover-bangladesh/${article.categorySlug}/${article.slug}`);
    notFound();
  }
  const categoryArticles = await getArticles(category.slug);
  return <><header className="page-hero"><PageContainer><Breadcrumbs items={[{ label: "Discover Bangladesh", href: "/discover-bangladesh" }, { label: category.title }]} /><span className="eyebrow">Discover Bangladesh</span><h1>{category.title}</h1><p className="lead">{category.description}</p></PageContainer></header><Section><PageContainer>{categoryArticles.length ? <div className="editorial-grid">{categoryArticles.map((article) => <ArticleCard key={article.slug} article={article} href={`/discover-bangladesh/${category.slug}/${article.slug}`} />)}</div> : <div className="empty-state"><h3>Stories are being prepared</h3><p>Reviewed articles will appear here as the library grows.</p></div>}</PageContainer></Section></>;
}
