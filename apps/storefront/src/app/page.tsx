import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Globe2,
  HandHeart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Sprout,
} from "lucide-react";
import { getStoreProducts } from "@/lib/commerce/server";
import { getRecipes } from "@/lib/sanity/editorial";
import { sanityFetch } from "@/lib/sanity/client";
import { HOME_QUERY } from "@/lib/sanity/queries";
import { ProductGrid } from "@/components/commerce/product-grid";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import "./home.css";

export const dynamic = "force-dynamic";

const categories = [
  {
    title: "Originals",
    href: "/shop/originals",
    image: "/images/campaign/pantry-lineup.jpg",
    position: "center",
  },
  {
    title: "Build a Box",
    href: "/shop/build-a-box",
    image: "/images/gifts/signature-keepsake-box.jpg",
    position: "center 64%",
  },
  {
    title: "New Arrivals",
    href: "/shop/new-arrivals",
    image: "/images/products/shahi-garam-masala-lifestyle.jpg",
    position: "center 52%",
  },
  {
    title: "Best Sellers",
    href: "/shop/best-sellers",
    image: "/images/products/mezban-masala-lifestyle.jpg",
    position: "center 56%",
  },
];

const promises = [
  { title: "Rooted in heritage", copy: "Regional recipes and culinary memory.", icon: Sprout },
  {
    title: "Authenticity first",
    copy: "Real ingredients and honest provenance.",
    icon: ShieldCheck,
  },
  { title: "Crafted with care", copy: "Small-batch attention to every blend.", icon: Sparkles },
  { title: "People-centered", copy: "Dignity for farmers, makers and partners.", icon: HandHeart },
];

const discoverFeatures = [
  { title: "Food Heritage", href: "/discover-bangladesh/food-heritage" },
  { title: "Regional Flavours", href: "/discover-bangladesh/regional-flavours" },
  { title: "Ingredient Stories", href: "/discover-bangladesh/ingredient-stories" },
  { title: "Farmer & Sourcing Stories", href: "/discover-bangladesh/farmer-sourcing-stories" },
  { title: "Cooking Guides", href: "/discover-bangladesh/cooking-guides" },
  { title: "Festivals & Seasons", href: "/discover-bangladesh/festivals-seasons" },
  { title: "Behind Bangla Blend", href: "/discover-bangladesh/behind-bangla-blend" },
];

interface ApprovedHomepage {
  eyebrow?: string;
  headline?: string;
  introduction?: string;
  heroImage?: string;
  heroImageAlt?: string;
  primaryAction?: { label?: string; href?: string };
  secondaryAction?: { label?: string; href?: string };
}

export default async function HomePage() {
  const [products, recipes, homepage] = await Promise.all([
    getStoreProducts(),
    getRecipes(),
    sanityFetch<ApprovedHomepage>(HOME_QUERY),
  ]);
  const featuredRecipe = recipes[0];
  const primaryAction = {
    label: homepage?.primaryAction?.label ?? "Shop the collection",
    href: homepage?.primaryAction?.href ?? "/shop",
  };
  const secondaryAction = {
    label: homepage?.secondaryAction?.label ?? "Discover Bangladesh",
    href: homepage?.secondaryAction?.href ?? "/discover-bangladesh",
  };

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-media">
          <Image
            src={homepage?.heroImage ?? "/images/home-hero-hathajari.jpg"}
            alt={
              homepage?.heroImageAlt ??
              "Bangla Blend Hathajari red chilli powder beside a brass spice box and a plated rice dish"
            }
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="shell home-hero-inner">
          <div className="home-hero-copy">
            <span className="eyebrow">{homepage?.eyebrow ?? "Bold flavors. Rooted stories."}</span>
            <h1>
              <span className="hero-bangla">বাংলাদেশের স্বাদ</span>
              {homepage?.headline ?? "The Taste of Bangladesh"}
            </h1>
            <p className="lead">
              {homepage?.introduction ??
                "Discover regional spice blends, pantry essentials, gifts and stories inspired by the kitchens, landscapes and communities of Bangladesh."}
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href={primaryAction.href}>
                {primaryAction.label}
                <ArrowRight size={16} />
              </Link>
              <Link className="button button-secondary" href={secondaryAction.href}>
                {secondaryAction.label}
              </Link>
            </div>
          </div>
          <span className="hero-edition">Bangla Blend · Crafted in Bangladesh</span>
        </div>
      </section>

      <section className="promise-strip" aria-label="What Bangla Blend stands for">
        <div className="shell promise-grid">
          {promises.map(({ title, copy, icon: Icon }) => (
            <article className="promise-item" key={title}>
              <Icon size={25} strokeWidth={1.5} />
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Section className="category-section">
        <PageContainer>
          <div className="home-section-heading">
            <div>
              <span className="eyebrow">The collection</span>
              <h2>Shop by category</h2>
            </div>
            <Link href="/shop" className="text-link">
              Shop all
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="home-category-grid">
            {categories.map((category) => (
              <Link key={category.href} href={category.href} className="home-category-card">
                <div className="home-category-media">
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    sizes="(max-width: 700px) 82vw, 25vw"
                    style={{ objectPosition: category.position }}
                  />
                </div>
                <span>
                  {category.title}
                  <ArrowRight size={17} />
                </span>
              </Link>
            ))}
          </div>
        </PageContainer>
      </Section>

      <Section className="impact-section">
        <PageContainer className="impact-layout">
          <div className="impact-intro">
            <span className="eyebrow">More than spices</span>
            <h2>Flavor with meaning.</h2>
            <p>
              We are building a proudly Bangladeshi food brand where regional taste, dignified
              partnerships and responsible craft belong together.
            </p>
            <Link href="/our-story/our-impact" className="button button-secondary">
              Our impact
            </Link>
          </div>
          <div className="impact-points">
            <article>
              <span>01</span>
              <h3>Rooted provenance</h3>
              <p>
                Products begin with a place, a dish and the people who keep its knowledge alive.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Clear standards</h3>
              <p>Traceability, ingredient clarity and verified claims build trust at every step.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Responsible growth</h3>
              <p>Better sourcing and thoughtful packaging guide how the brand grows.</p>
            </article>
          </div>
        </PageContainer>
      </Section>

      <section className="region-feature">
        <div className="region-feature-grid">
          <div className="region-feature-media">
            <Image
              src="/images/bangladesh-river-landscape.png"
              alt="An illustrative dawn view of fields beside a broad river in Bangladesh"
              fill
              sizes="(max-width: 960px) 100vw, 55vw"
            />
          </div>
          <div className="region-feature-copy">
            <span className="eyebrow">Our story</span>
            <h2>Rooted in Bangladesh</h2>
            <p>
              From river deltas and tea gardens to coastal kitchens and city tables, Bangla Blend
              carries regional flavor into a modern, premium expression of home.
            </p>
            <p>
              Every blend is an invitation to discover the people, places and food traditions behind
              it.
            </p>
            <Link href="/our-story" className="button button-secondary">
              About Bangla Blend
            </Link>
          </div>
        </div>
        <div className="feature-strip">
          {discoverFeatures.map((feature) => (
            <Link className="feature-link" key={feature.href} href={feature.href}>
              <span className="feature-name">{feature.title}</span>
              <span className="feature-arrow">
                <ArrowUpRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Section className="featured-products-section">
        <PageContainer>
          <div className="home-section-heading">
            <div>
              <span className="eyebrow">From the pantry</span>
              <h2>Featured blends</h2>
            </div>
            <Link href="/shop/originals" className="text-link">
              View all products
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <ProductGrid products={products.slice(0, 4)} />
        </PageContainer>
      </Section>

      <Section className="market-section">
        <PageContainer>
          <div className="market-heading">
            <div>
              <span className="eyebrow">One front door, two journeys</span>
              <h2>From our land to your kitchen.</h2>
            </div>
            <p>
              Availability, currency, shipping, payment and customs guidance adapt to the
              destination selected in the header.
            </p>
          </div>
          <div className="market-cards">
            <Link className="market-card" href="/shop">
              <div className="market-card-top">
                <span>Bangladesh</span>
                <MapPin size={22} />
              </div>
              <div>
                <h3>Shop locally in BDT</h3>
                <p>
                  Explore products and gifts available for supported locations across Bangladesh.
                </p>
                <span className="text-link">
                  Enter the local shop
                  <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
            <Link className="market-card" href="/shop">
              <div className="market-card-top">
                <span>International</span>
                <Globe2 size={22} />
              </div>
              <div>
                <h3>A taste of home, worldwide</h3>
                <p>
                  Select an active country to see products currently eligible for international
                  delivery.
                </p>
                <span className="text-link">
                  Explore worldwide
                  <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          </div>
        </PageContainer>
      </Section>

      <Section className="recipe-feature-section">
        <PageContainer>
          <div className="home-section-heading">
            <div>
              <span className="eyebrow">Cook Bangladesh</span>
              <h2>Recipes with a sense of place</h2>
            </div>
            <Link href="/recipes" className="text-link">
              Browse recipes
              <ArrowUpRight size={14} />
            </Link>
          </div>
          {featuredRecipe ? (
            <Link href={`/recipes/${featuredRecipe.slug}`} className="home-recipe-feature">
              <div className="home-recipe-media">
                <Image
                  src={featuredRecipe.image}
                  alt={featuredRecipe.imageAlt}
                  fill
                  sizes="(max-width: 800px) 100vw, 58vw"
                />
              </div>
              <div className="home-recipe-copy">
                <span className="eyebrow">
                  Recipe · {featuredRecipe.prepTime + featuredRecipe.cookTime} minutes
                </span>
                <h3>{featuredRecipe.title}</h3>
                <p>{featuredRecipe.excerpt}</p>
                <span className="button button-light">Cook the recipe</span>
              </div>
            </Link>
          ) : (
            <div className="home-recipe-feature">
              <div className="home-recipe-media">
                <Image
                  src="/images/shorisha-ilish-recipe.png"
                  alt="Shorisha ilish served with mustard and green chilli"
                  fill
                  sizes="(max-width: 800px) 100vw, 58vw"
                />
              </div>
              <div className="home-recipe-copy">
                <span className="eyebrow">Recipe library</span>
                <h3>Cook with memory, season and place.</h3>
                <p>Recipes open after kitchen testing and editorial review.</p>
                <Link href="/recipes" className="button button-light">
                  Visit the library
                </Link>
              </div>
            </div>
          )}
        </PageContainer>
      </Section>
    </>
  );
}
