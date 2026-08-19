import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ComingSoonPage } from "@/components/editorial/coming-soon-page";
import { PageContainer } from "@/components/layout/page-container";
import { discoverComingSoonPages } from "@/config/coming-soon";
import { journalCategories } from "@/lib/content/fallback-content";
import { getArticles } from "@/lib/content/editorial";
import "../../editorial.css";
import "../stories.css";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const comingSoonPage = discoverComingSoonPages[slug as keyof typeof discoverComingSoonPages];
  if (comingSoonPage) {
    return { title: `${comingSoonPage.title} — Coming Soon`, description: comingSoonPage.description };
  }
  const category = journalCategories.find((item) => item.slug === slug);
  return {
    title: category?.title ?? "Discover Bangladesh",
    description: category?.description,
    robots: { index: Boolean(category), follow: Boolean(category) },
    alternates: category ? { canonical: `/discover-bangladesh/${category.slug}` } : undefined,
  };
}

export default async function DiscoverCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const comingSoonPage = discoverComingSoonPages[slug as keyof typeof discoverComingSoonPages];
  if (comingSoonPage) return <ComingSoonPage {...comingSoonPage} />;

  const category = journalCategories.find((item) => item.slug === slug);
  if (!category) {
    const article = (await getArticles()).find((item) => item.slug === slug);
    if (article) redirect(`/discover-bangladesh/${article.categorySlug}/${article.slug}`);
    notFound();
  }

  const articles = await getArticles(category.slug);
  const [leadArticle, ...remainingArticles] = articles;

  return (
    <main className="story-index">
      <header className="story-index-hero">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Discover Bangladesh", href: "/discover-bangladesh" }, { label: category.title }]} />
          <div className="story-index-heading">
            <div>
              <span className="story-kicker">The Bangla Blend journal</span>
              <h1>{category.title}</h1>
            </div>
            <p>{category.description}</p>
          </div>
        </PageContainer>
      </header>

      <PageContainer>
        {leadArticle ? (
          <section className="story-lead-card" aria-label="Featured story">
            <Link className="story-lead-media" href={`/discover-bangladesh/${category.slug}/${leadArticle.slug}`}>
              <Image src={leadArticle.image} alt={leadArticle.imageAlt} fill priority sizes="(max-width: 800px) 100vw, 62vw" />
            </Link>
            <div className="story-lead-copy">
              <div className="story-card-meta"><span>Featured story</span><span>{leadArticle.readingTime} min read</span></div>
              <h2><Link href={`/discover-bangladesh/${category.slug}/${leadArticle.slug}`}>{leadArticle.title}</Link></h2>
              <p>{leadArticle.excerpt}</p>
              <Link className="story-button" href={`/discover-bangladesh/${category.slug}/${leadArticle.slug}`}>
                Read the story <ArrowUpRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </section>
        ) : (
          <section className="story-empty"><span className="story-kicker">In editorial review</span><h2>Stories are being prepared</h2><p>Reviewed articles will appear here as the library grows.</p></section>
        )}

        {remainingArticles.length ? (
          <section className="story-index-more" aria-labelledby="more-stories-title">
            <div className="story-section-title"><span>Continue exploring</span><h2 id="more-stories-title">More {category.title}</h2></div>
            <div className="story-index-grid">
              {remainingArticles.map((article) => (
                <article className="story-index-card" key={article.slug}>
                  <Link className="story-index-card-media" href={`/discover-bangladesh/${category.slug}/${article.slug}`}>
                    <Image src={article.image} alt={article.imageAlt} fill sizes="(max-width: 700px) 100vw, 50vw" />
                  </Link>
                  <div className="story-index-card-copy">
                    <div className="story-card-meta"><span>{article.category}</span><span>{article.readingTime} min read</span></div>
                    <h3><Link href={`/discover-bangladesh/${category.slug}/${article.slug}`}>{article.title}</Link></h3>
                    <p>{article.excerpt}</p>
                    <Link className="story-text-link" href={`/discover-bangladesh/${category.slug}/${article.slug}`}>Read article <span aria-hidden="true">→</span></Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </PageContainer>
    </main>
  );
}
