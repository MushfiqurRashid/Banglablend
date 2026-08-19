import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin } from "lucide-react";
import { RecipeLibrary } from "@/components/editorial/recipe-library";
import { PageContainer } from "@/components/layout/page-container";
import { getRecipes } from "@/lib/content/editorial";
import { siteConfig } from "@/config/site";
import "./recipes.css";

export const metadata: Metadata = {
  title: "Bangladeshi Recipes | The Bangla Blend Kitchen",
  description:
    "Cook verified Bangladeshi recipes with clear methods, regional context and considered spice pairings from the Bangla Blend Kitchen.",
  alternates: { canonical: "/recipes" },
  openGraph: {
    title: "The Bangla Blend Kitchen",
    description: "A considered library of Bangladeshi recipes, tested for the home kitchen.",
    url: "/recipes",
    images: [{ url: "/images/recipes/rui-shorshe-jhal-wide.webp", alt: "Rui Shorshe Jhal" }],
  },
};

export default async function RecipesPage() {
  const recipes = await getRecipes();
  const feature = recipes.find((recipe) => recipe.featured) ?? recipes[0];
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Bangla Blend recipe library",
    itemListElement: recipes.map((recipe, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteConfig.url}/recipes/${recipe.slug}`,
      name: recipe.title,
    })),
  };

  return (
    <main className="recipe-library-page">
      {feature ? (
        <section className="recipe-library-hero" aria-labelledby="recipe-library-title">
          <div className="recipe-library-hero-media">
            <Image src={feature.imageWide} alt={feature.imageAlt} fill priority sizes="(max-width: 860px) 100vw, 58vw" />
          </div>
          <PageContainer className="recipe-library-hero-shell">
            <div className="recipe-library-hero-copy">
              <span className="recipe-kicker">The Bangla Blend Kitchen</span>
              <h1 id="recipe-library-title">Recipes rooted in Bangladesh</h1>
              <p>Regional classics and generous everyday cooking, written with care and made for the modern home kitchen.</p>
              <div className="recipe-library-hero-actions">
                <Link href="#recipe-library" className="recipe-button recipe-button-primary">
                  Browse the library <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href={`/recipes/${feature.slug}`} className="recipe-button recipe-button-quiet">Cook {feature.title}</Link>
              </div>
              <div className="recipe-library-hero-meta" aria-label="Featured recipe details">
                <span><Clock3 size={15} aria-hidden="true" /> {feature.totalTime} minutes</span>
                <span><MapPin size={15} aria-hidden="true" /> {feature.region}</span>
              </div>
            </div>
          </PageContainer>
        </section>
      ) : null}

      <section className="recipe-library-intro" aria-labelledby="recipe-library-intro-title">
        <PageContainer>
          <span className="recipe-kicker">Cook with confidence</span>
          <div className="recipe-library-intro-grid">
            <h2 id="recipe-library-intro-title">A living archive of flavour</h2>
            <p>Every recipe includes a clear mise en place, carefully ordered steps, practical tips and food-safety guidance. Explore by dish, region or the way you cook today.</p>
          </div>
          <nav className="recipe-collection-links" aria-label="Recipe collections">
            <Link href="/recipes/traditional"><span>01</span> Traditional table</Link>
            <Link href="/recipes/everyday-cooking"><span>02</span> Everyday cooking</Link>
            <Link href="/recipes/by-region"><span>03</span> By region</Link>
            <Link href="/recipes/by-product"><span>04</span> Shop the pantry</Link>
          </nav>
        </PageContainer>
      </section>

      <RecipeLibrary recipes={recipes} />

      <section className="recipe-library-note">
        <PageContainer className="recipe-library-note-inner">
          <span className="recipe-kicker">From spice to table</span>
          <blockquote>“The best recipes carry more than flavour. They hold a place, a season and a memory.”</blockquote>
          <Link href="/shop" className="recipe-text-link">Explore the Bangla Blend pantry <ArrowRight size={16} aria-hidden="true" /></Link>
        </PageContainer>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, "\\u003c") }} />
    </main>
  );
}
