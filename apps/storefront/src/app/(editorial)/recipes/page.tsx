import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, CookingPot, Grid2X2, MapPin, PackageSearch, Soup } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import "../editorial.css";
import "./recipes.css";

export const metadata: Metadata = {
  title: "Recipes",
  description:
    "Explore Bangladeshi favourites, regional dishes and practical everyday recipes from the Bangla Blend kitchen.",
};

const recipeCategories = [
  {
    title: "By Region",
    description: "Explore recipes from the different regions of Bangladesh.",
    href: "/recipes/by-region",
    image: "/images/bangladesh-river-landscape.png",
    imageAlt: "A river landscape in Bangladesh at dawn",
    icon: MapPin,
    imagePosition: "center",
  },
  {
    title: "By Product",
    description: "Find recipes using your favourite Bangla Blend products.",
    href: "/recipes/by-product",
    image: "/images/our-story-standards.png",
    imageAlt: "Whole and ground spices arranged in small bowls",
    icon: PackageSearch,
    imagePosition: "center",
  },
  {
    title: "Traditional",
    description: "Discover dishes connected to established food traditions.",
    href: "/recipes/traditional",
    image: "/images/our-story-craft.png",
    imageAlt: "Hands grinding a fragrant spice mixture in a stone mortar",
    icon: CookingPot,
    imagePosition: "center 58%",
  },
  {
    title: "Everyday Cooking",
    description: "Simple, generous recipes for the rhythm of everyday meals.",
    href: "/recipes/everyday-cooking",
    image: "/images/recipe-chana-dal-bhuna.png",
    imageAlt: "Golden chana dal bhuna in a dark earthenware bowl",
    icon: Soup,
    imagePosition: "center",
  },
  {
    title: "All Recipes",
    description: "Browse the complete Bangla Blend recipe collection.",
    href: "/recipes#featured-recipes",
    image: "/images/shorisha-ilish-recipe.png",
    imageAlt: "Mustard fish curry served with green chillies and rice",
    icon: Grid2X2,
    imagePosition: "center",
  },
] as const;

const featuredRecipes = [
  {
    title: "Mezban Gosh",
    category: "Traditional",
    description: "A rich, aromatic beef curry with deep roasted spice and chilli notes.",
    time: "60 min",
    difficulty: "Medium",
    href: "/recipes/traditional",
    image: "/images/recipe-mezban-gosh.png",
    imageAlt: "Mezban-style beef curry in a hammered brass bowl",
  },
  {
    title: "Rui Macher Jhol",
    category: "By Region",
    description: "A light, comforting fish curry with mustard, green chilli and warm spice.",
    time: "35 min",
    difficulty: "Easy",
    href: "/recipes/by-region",
    image: "/images/shorisha-ilish-recipe.png",
    imageAlt: "Golden mustard fish curry in a dark earthenware bowl",
  },
  {
    title: "Chana Dal Bhuna",
    category: "Everyday Cooking",
    description: "A hearty chickpea dal finished with caramelised onion and green chilli.",
    time: "45 min",
    difficulty: "Easy",
    href: "/recipes/everyday-cooking",
    image: "/images/recipe-chana-dal-bhuna.png",
    imageAlt: "Golden chana dal bhuna with fried onion and green chilli",
  },
  {
    title: "Grilled Hilsa",
    category: "By Product",
    description: "Hilsa steaks with a bold mustard-spice crust and bright citrus.",
    time: "30 min",
    difficulty: "Medium",
    href: "/recipes/by-product",
    image: "/images/recipe-grilled-hilsa.png",
    imageAlt: "Grilled hilsa steaks with green chillies and lime",
  },
  {
    title: "Masala Chai",
    category: "Beverage",
    description: "A warming milk tea layered with ginger, cardamom and cinnamon.",
    time: "15 min",
    difficulty: "Easy",
    href: "/recipes/everyday-cooking",
    image: "/images/recipe-masala-chai.png",
    imageAlt: "Steaming masala chai in two handmade clay cups",
  },
] as const;

function SectionOrnament() {
  return (
    <span className="recipes-landing-ornament" aria-hidden="true">
      <span />
    </span>
  );
}

export default function RecipesPage() {
  return (
    <div className="recipes-page recipes-landing">
      <section className="recipes-landing-hero" aria-labelledby="recipes-page-title">
        <PageContainer className="recipes-landing-hero-grid">
          <div className="recipes-landing-hero-copy">
            <Breadcrumbs items={[{ label: "Recipes" }]} />
            <h1 id="recipes-page-title">Recipes</h1>
            <SectionOrnament />
            <p>
              Explore the flavours of Bangladesh through traditional favourites, regional
              specialities and everyday recipes made better with the right spices.
            </p>
            <Link
              className="recipes-landing-button recipes-landing-button-solid"
              href="#featured-recipes"
            >
              Explore recipes
            </Link>
          </div>
          <div className="recipes-landing-hero-media">
            <Image
              src="/images/shorisha-ilish-recipe.png"
              alt="Mustard fish curry with green chillies, served beside steamed rice"
              fill
              priority
              sizes="(max-width: 820px) 100vw, 60vw"
            />
          </div>
        </PageContainer>
      </section>

      <section className="recipes-landing-browse" aria-labelledby="browse-recipes-title">
        <PageContainer>
          <div className="recipes-landing-centered-heading">
            <h2 id="browse-recipes-title">Browse Recipes By</h2>
            <SectionOrnament />
          </div>
          <nav className="recipes-landing-category-grid" aria-label="Browse recipes by">
            {recipeCategories.map(
              ({ title, description, href, image, imageAlt, icon: Icon, imagePosition }) => (
                <Link
                  className="recipes-landing-category-card"
                  href={href}
                  key={title}
                  aria-label={title}
                >
                  <Image
                    src={image}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 700px) 78vw, (max-width: 1080px) 40vw, 20vw"
                    style={{ objectPosition: imagePosition }}
                  />
                  <span className="recipes-landing-category-shade" aria-hidden="true" />
                  <span className="recipes-landing-category-content">
                    <Icon size={43} strokeWidth={1.35} aria-hidden="true" />
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </span>
                </Link>
              ),
            )}
          </nav>
        </PageContainer>
      </section>

      <section
        className="recipes-landing-featured"
        id="featured-recipes"
        aria-labelledby="featured-recipes-title"
      >
        <PageContainer>
          <div className="recipes-landing-featured-heading">
            <div>
              <h2 id="featured-recipes-title">Featured Recipes</h2>
              <SectionOrnament />
            </div>
            <Link
              className="recipes-landing-button recipes-landing-button-outline"
              href="/recipes#featured-recipes"
            >
              View all recipes
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="recipes-landing-feature-grid">
            {featuredRecipes.map((recipe) => (
              <article className="recipes-feature-card" key={recipe.title}>
                <Link
                  className="recipes-landing-feature-card-link"
                  href={recipe.href}
                  aria-label={`Explore ${recipe.title} recipes`}
                >
                  <span className="recipes-landing-feature-media">
                    <Image
                      src={recipe.image}
                      alt={recipe.imageAlt}
                      fill
                      sizes="(max-width: 700px) 82vw, (max-width: 1080px) 42vw, 20vw"
                    />
                  </span>
                  <span className="recipes-landing-feature-body">
                    <span className="recipes-landing-feature-category">{recipe.category}</span>
                    <strong className="recipes-landing-feature-title">{recipe.title}</strong>
                    <span className="recipes-landing-feature-description">
                      {recipe.description}
                    </span>
                    <span className="recipes-landing-feature-meta">
                      <span>
                        <Clock3 size={13} aria-hidden="true" />
                        {recipe.time}
                      </span>
                      <span>{recipe.difficulty}</span>
                      <ArrowRight
                        className="recipes-landing-feature-arrow"
                        size={17}
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="recipes-landing-cta-section">
        <PageContainer>
          <div className="recipes-spice-cta">
            <Image
              src="/images/hero-spice-still-life.png"
              alt="Bangla Blend spice jars and bowls of whole and ground spices"
              fill
              sizes="(max-width: 900px) 100vw, 90vw"
            />
            <span className="recipes-landing-cta-shade" aria-hidden="true" />
            <div className="recipes-landing-cta-copy">
              <h2>
                Cook Better With
                <br />
                The Right Spices
              </h2>
              <p>
                Explore recipes created with Bangla Blend spices and bring confident flavour to your
                kitchen.
              </p>
              <Link className="recipes-landing-button recipes-landing-button-solid" href="/shop">
                Shop spices
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
