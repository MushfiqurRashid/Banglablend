import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { siteConfig } from "@/config/site";
import { getArticle, getArticles } from "@/lib/content/editorial";
import "../../../editorial.css";
import "../../stories.css";

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const article = await getArticle(category, slug);
  if (!article) return { title: "Story not found", robots: { index: false, follow: false } };
  const canonical = `/discover-bangladesh/${article.categorySlug}/${article.slug}`;
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical },
    robots: { index: article.verified, follow: article.verified },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: canonical,
      publishedTime: article.publishedAt,
      authors: [article.author],
      images: [{ url: article.image, alt: article.imageAlt }],
    },
  };
}

export default async function DiscoverArticlePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const article = await getArticle(category, slug);
  if (!article) notFound();

  const formattedDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(article.publishedAt));
  const related = (await getArticles(article.categorySlug)).filter((item) => item.slug !== article.slug).slice(0, 2);
  const canonical = `${siteConfig.url}/discover-bangladesh/${article.categorySlug}/${article.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: [new URL(article.image, siteConfig.url).toString()],
    datePublished: article.publishedAt,
    author: { "@type": article.author === "Bangla Blend Editorial" ? "Organization" : "Person", name: article.author, url: siteConfig.url },
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    mainEntityOfPage: canonical,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Discover Bangladesh", item: `${siteConfig.url}/discover-bangladesh` },
      { "@type": "ListItem", position: 2, name: article.category, item: `${siteConfig.url}/discover-bangladesh/${article.categorySlug}` },
      { "@type": "ListItem", position: 3, name: article.title, item: canonical },
    ],
  };

  return (
    <main className="story-page">
      <header className="story-hero">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Discover Bangladesh", href: "/discover-bangladesh" }, { label: article.category, href: `/discover-bangladesh/${article.categorySlug}` }, { label: article.title }]} />
          <div className="story-hero-grid">
            <div className="story-hero-copy">
              <span className="story-kicker">{article.category}</span>
              <h1>{article.title}</h1>
              <p>{article.excerpt}</p>
              <div className="story-byline">
                <span>By {article.author}</span>
                <span aria-hidden="true">•</span>
                <time dateTime={article.publishedAt}>{formattedDate}</time>
                <span aria-hidden="true">•</span>
                <span>{article.readingTime} min read</span>
              </div>
            </div>
            <figure className="story-hero-media">
              <Image src={article.image} alt={article.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 58vw" />
              {article.imageCredit ? <figcaption>{article.imageCredit}</figcaption> : null}
            </figure>
          </div>
        </PageContainer>
      </header>

      {!article.verified ? <PageContainer><p className="preview-note">Development preview · this story is not approved for publication.</p></PageContainer> : null}

      <PageContainer>
        <div className="story-reading-layout">
          {article.sections?.length ? (
            <aside className="story-toc" aria-label="In this story">
              <span>In this story</span>
              <ol>
                {article.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}
              </ol>
            </aside>
          ) : null}

          <article className="story-content">
            {article.intro?.length ? (
              <div className="story-intro">
                {article.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            ) : null}

            {article.sections?.map((section, index) => (
              <section className={`story-chapter${section.image ? " has-image" : ""}`} id={section.id} key={section.id}>
                <div className="story-chapter-copy">
                  {section.eyebrow ? <span className="story-kicker">{section.eyebrow}</span> : null}
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.highlights?.length ? (
                    <ul className="story-highlights" aria-label={`${section.title} at a glance`}>
                      {section.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                    </ul>
                  ) : null}
                </div>
                {section.image ? (
                  <figure className="story-chapter-media">
                    <div className="story-chapter-image">
                      <Image src={section.image.url} alt={section.image.alt} fill sizes="(max-width: 900px) 100vw, 48vw" style={section.image.position ? { objectPosition: section.image.position } : undefined} />
                    </div>
                    {section.image.caption || section.image.credit ? (
                      <figcaption><span>{section.image.caption}</span>{section.image.credit ? <small>{section.image.credit}</small> : null}</figcaption>
                    ) : null}
                  </figure>
                ) : null}
                {section.pullQuote ? <blockquote>{section.pullQuote}</blockquote> : null}
                <span className="story-chapter-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              </section>
            ))}

            {!article.sections?.length && article.body ? <div className="story-legacy-body"><PortableText value={article.body} /></div> : null}
            {!article.sections?.length && article.previewParagraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

            {article.sources?.length || article.editorialNote ? (
              <footer className="story-notes">
                <div>
                  <span className="story-kicker">Editorial note</span>
                  <p>{article.editorialNote ?? "This story is reviewed as new evidence and contributor context become available."}</p>
                </div>
                {article.sources?.length ? (
                  <div>
                    <h2>Further reading</h2>
                    <ul>{article.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight aria-hidden="true" size={13} /></a></li>)}</ul>
                  </div>
                ) : null}
              </footer>
            ) : null}
          </article>
        </div>

        <section className="story-endcap" aria-label="Continue exploring">
          <div><span className="story-kicker">Continue exploring</span><h2>{related.length ? `More ${article.category}` : "Return to the journal"}</h2></div>
          {related.length ? (
            <div className="story-related-grid">
              {related.map((item) => (
                <Link className="story-related-card" href={`/discover-bangladesh/${item.categorySlug}/${item.slug}`} key={item.slug}>
                  <span className="story-related-image"><Image src={item.image} alt="" fill sizes="(max-width: 700px) 35vw, 14vw" /></span>
                  <span><small>{item.readingTime} min read</small><strong>{item.title}</strong></span>
                  <ArrowUpRight aria-hidden="true" size={18} />
                </Link>
              ))}
            </div>
          ) : (
            <Link className="story-button story-button-light" href={`/discover-bangladesh/${article.categorySlug}`}><ArrowLeft aria-hidden="true" size={16} /> All {article.category}</Link>
          )}
        </section>
      </PageContainer>

      {article.verified ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([articleJsonLd, breadcrumbJsonLd]).replace(/</g, "\\u003c") }} /> : null}
    </main>
  );
}
