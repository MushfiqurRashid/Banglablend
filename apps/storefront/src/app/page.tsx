import Image from "next/image";
import Link from "@/components/navigation/smart-link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Globe2,
  HandHeart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Sprout,
} from "lucide-react";
import { getStoreProducts } from "@/lib/commerce/server";
import { getRecipes } from "@/lib/content/editorial";
import { getHomepage } from "@/lib/content/queries";
import { ProductGrid } from "@/components/commerce/product-grid";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { WhyBanglaBlend } from "@/components/marketing/why-bangla-blend";
import "./home.css";

export const dynamic = "force-dynamic";

const categories = [
  {
    title: "New Arrivals",
    href: "/shop/new-arrivals",
    image: "/images/products/shahi-garam-masala-lifestyle.jpg",
    position: "center 52%",
  },
  {
    title: "Originals",
    href: "/shop/originals",
    image: "/images/campaign/pantry-lineup.jpg",
    position: "center",
  },
  {
    title: "Reserve",
    href: "/shop/reserve",
    image: "/images/products/pepper-pair.jpg",
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
  { title: "Crafted with care", copy: "Careful attention goes into every blend.", icon: Sparkles },
  { title: "People first", copy: "Dignity for farmers, makers and partners.", icon: HandHeart },
];

const communityRecipeSuggestions = [
  {
    title: "Mezban Gosh",
    category: "Traditional",
    time: "60 min",
    difficulty: "Intermediate",
    href: "/recipes/traditional",
    image: "/images/recipe-mezban-gosh.webp",
    imageAlt: "Mezban beef curry in a hammered brass bowl",
  },
  {
    title: "Chana Dal Bhuna",
    category: "Everyday cooking",
    time: "45 min",
    difficulty: "Beginner",
    href: "/recipes/everyday-cooking",
    image: "/images/recipe-chana-dal-bhuna.webp",
    imageAlt: "Golden chana dal bhuna with fried onion and green chilli",
  },
  {
    title: "Grilled Hilsa",
    category: "By product",
    time: "30 min",
    difficulty: "Intermediate",
    href: "/recipes/by-product",
    image: "/images/recipe-grilled-hilsa.webp",
    imageAlt: "Grilled hilsa steaks with green chillies and lime",
  },
  {
    title: "Masala Chai",
    category: "Beverage",
    time: "15 min",
    difficulty: "Beginner",
    href: "/recipes/everyday-cooking",
    image: "/images/recipe-masala-chai.webp",
    imageAlt: "Steaming masala chai in handmade clay cups",
  },
] as const;

const discoverFeatures = [
  { title: "Food Heritage", href: "/discover-bangladesh/food-heritage" },
  { title: "Regional Flavours", href: "/discover-bangladesh/regional-flavours" },
  { title: "Ingredient Stories", href: "/discover-bangladesh/ingredient-stories" },
  { title: "Farmer & Sourcing Stories", href: "/discover-bangladesh/farmer-sourcing-stories" },
  { title: "Cooking Guides", href: "/discover-bangladesh/cooking-guides" },
  { title: "Festivals & Seasons", href: "/discover-bangladesh/festivals-seasons" },
  { title: "Behind Bangla Blend", href: "/discover-bangladesh/behind-bangla-blend" },
];

export default async function HomePage() {
  const [products, recipes, homepage] = await Promise.all([
    getStoreProducts(),
    getRecipes(),
    getHomepage(),
  ]);
  const mostPopularProducts = products
    .filter((product) => product.bestSeller === true)
    .slice(0, 4);
  const communityFeature = recipes[0] ?? {
    title: "Shorisha Ilish",
    slug: "shorisha-ilish",
    excerpt: "A fish preparation rich with mustard, green chilli and warm spice, served with steamed rice.",
    prepTime: 20,
    cookTime: 25,
    image: "/images/shorisha-ilish-recipe.webp",
    imageAlt: "Shorisha ilish served with mustard, green chilli and rice",
  };
  const primaryAction = {
    label: homepage?.primaryAction?.label ?? "Shop the collection",
    href: homepage?.primaryAction?.href ?? "/shop",
  };
  const secondaryAction = {
    label: homepage?.secondaryAction?.label ?? "Explore recipes",
    href: homepage?.secondaryAction?.href ?? "/recipes",
  };
  return (
    <>
      <section className="home-hero">
        <div className="home-hero-media">
          <Image
            src={homepage?.heroImage ?? "/images/home-hero-premium-v2.webp"}
            alt={
              homepage?.heroImageAlt ??
              "Bangla Blend Hathajari red chilli powder with a brass spice box and a regional rice dish"
            }
            fill
            priority
            fetchPriority="high"
            quality={75}
            sizes="100vw"
          />
        </div>
        <div className="shell home-hero-inner">
          <div className="home-hero-copy">
            <span className="eyebrow">
              {homepage?.eyebrow ?? "Regional spice blends · Crafted in Bangladesh"}
            </span>
            <h1>{homepage?.headline ?? "Bring home the taste of Bangladesh"}</h1>
            <p className="lead">
              {homepage?.introduction ??
                "Small-batch spice blends inspired by regional cooking, made with carefully sourced ingredients and no unnecessary additives."}
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
                {copy ? <p>{copy}</p> : null}
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
                    quality={70}
                    sizes="(max-width: 700px) 64vw, 25vw"
                    fetchPriority="low"
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

      <Section className="most-popular-section">
        <PageContainer>
          <div className="home-section-heading">
            <div>
              <span className="eyebrow">Community favourites</span>
              <h2>Most Popular</h2>
            </div>
            <Link href="/shop/best-sellers" className="text-link">
              View all popular
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div
            className="most-popular-products"
            data-count={Math.min(mostPopularProducts.length, 4)}
          >
            <ProductGrid products={mostPopularProducts} action="order" />
          </div>
        </PageContainer>
      </Section>

      <section className="region-feature">
        <div className="region-feature-grid">
          <div className="region-feature-media">
            <Image
              src="/images/bangladesh-blended-map.webp"
              alt="Bangladesh Blended spice map highlighting the regional flavours of Rangpur, Mymensingh, Sylhet, Rajshahi, Dhaka, Chattogram, Khulna and Barishal"
              fill
              sizes="(max-width: 800px) 100vw, 55vw"
            />
          </div>
          <div className="region-feature-copy">
            <span className="region-feature-monogram" aria-hidden="true">
              বাংলা
            </span>
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
            <Link href="/about-bangla-blend" className="button button-secondary">
              About Bangla Blend
            </Link>
            <div className="region-feature-notes" aria-label="Bangla Blend provenance">
              <span>
                <strong>08</strong>
                Regional touchpoints
              </span>
              <span>
                <strong>River to coast</strong>
                Place is our first ingredient
              </span>
              <span>
                <strong>One country</strong>
                Many living food traditions
              </span>
            </div>
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

      <Section className="impact-section">
        <PageContainer className="impact-editorial">
          <div className="impact-visual">
            <Image
              src="/images/our-story-craft.webp"
              alt="Spices being ground by hand in a traditional stone mortar"
              fill
              sizes="(max-width: 800px) 100vw, 52vw"
            />
            <div className="impact-visual-copy">
              <span className="eyebrow">More than spices</span>
              <h2>Flavor with meaning.</h2>
              <p>
                Regional taste, dignified partnerships and responsible craft belong together.
              </p>
            </div>
            <span className="impact-visual-note">Crafted with purpose · Bangladesh</span>
          </div>

          <div className="impact-principles">
            <header className="impact-principles-header">
              <span>How we grow</span>
              <h3>Purpose, made practical.</h3>
              <p>Three principles guide every product, partnership and decision.</p>
            </header>

            <div className="impact-principle-list">
              <article>
                <span className="impact-principle-mark">
                  <span>01</span>
                  <Sprout size={23} strokeWidth={1.35} aria-hidden="true" />
                </span>
                <div>
                  <h4>Rooted provenance</h4>
                  <p>
                    Products begin with a place, a dish and the people who keep its knowledge
                    alive.
                  </p>
                </div>
              </article>
              <article>
                <span className="impact-principle-mark">
                  <span>02</span>
                  <ShieldCheck size={23} strokeWidth={1.35} aria-hidden="true" />
                </span>
                <div>
                  <h4>Clear standards</h4>
                  <p>
                    Traceability, ingredient clarity and verified claims build trust at every step.
                  </p>
                </div>
              </article>
              <article>
                <span className="impact-principle-mark">
                  <span>03</span>
                  <HandHeart size={23} strokeWidth={1.35} aria-hidden="true" />
                </span>
                <div>
                  <h4>Responsible growth</h4>
                  <p>Better sourcing and thoughtful packaging guide how the brand grows.</p>
                </div>
              </article>
            </div>

            <Link href="/our-story/our-impact" className="button button-primary">
              Explore our impact
              <ArrowRight size={16} />
            </Link>
          </div>
        </PageContainer>
      </Section>

      <Section className="recipe-feature-section">
        <PageContainer>
          <header className="community-recipe-heading">
            <h2>Recipes Our Community Loves</h2>
            <p>The recipes everyone keeps coming back for!</p>
          </header>
          <Link href={`/recipes/${communityFeature.slug}`} className="home-recipe-feature">
              <div className="home-recipe-media">
                <Image
                  src={communityFeature.image}
                  alt={communityFeature.imageAlt}
                  fill
                  sizes="(max-width: 800px) 100vw, 58vw"
                />
                <span className="community-favorite-badge">Community favorite</span>
              </div>
              <div className="home-recipe-copy">
                <span className="eyebrow">
                  Featured recipe · {communityFeature.prepTime + communityFeature.cookTime} minutes
                </span>
                <h3>{communityFeature.title}</h3>
                <p>{communityFeature.excerpt}</p>
                <span className="button button-light">Cook the recipe</span>
              </div>
          </Link>

          <div className="community-recipe-suggestions">
            <div className="community-recipe-suggestions-heading">
              <h3>More community favorites</h3>
              <Link href="/recipes" className="text-link">
                Explore all recipes
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="community-recipe-grid">
              {communityRecipeSuggestions.map((recipe) => (
                <Link className="community-recipe-card" href={recipe.href} key={recipe.title}>
                  <span className="community-recipe-card-media">
                    <Image
                      src={recipe.image}
                      alt={recipe.imageAlt}
                      fill
                      sizes="(max-width: 700px) 78vw, (max-width: 1050px) 48vw, 25vw"
                    />
                    <span className="community-popular-badge">Popular</span>
                  </span>
                  <span className="community-recipe-card-body">
                    <span className="community-recipe-category">{recipe.category}</span>
                    <strong>{recipe.title}</strong>
                    <span className="community-recipe-meta">
                      <span>
                        <Clock3 size={13} aria-hidden="true" />
                        {recipe.time}
                      </span>
                      <span>{recipe.difficulty}</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="community-recipe-actions">
            <Link href="/recipes" className="button button-primary">
              Explore all recipes
              <ArrowRight size={16} />
            </Link>
          </div>
        </PageContainer>
      </Section>

      <Section className="market-section">
        <div className="market-showcase">
          <div className="market-story">
            <Image
              className="market-story-backdrop"
              src="/images/bangladesh-river-landscape.webp"
              alt=""
              fill
              sizes="(max-width: 800px) 100vw, 36vw"
            />
            <div>
              <span className="eyebrow">Two markets · one standard</span>
              <h2>From our land to your kitchen.</h2>
              <p>
                Thoughtfully made in Bangladesh, then presented for the way you shop, whether at
                home or further afield.
              </p>
            </div>

            <div className="market-story-art" aria-hidden="true">
              <span className="market-story-orbit" />
              <Globe2 size={82} strokeWidth={0.85} />
              <span>Rooted in Bangladesh</span>
            </div>

            <div className="market-story-meta" aria-label="Market shopping benefits">
              <div>
                <strong>BDT</strong>
                <span>Local pricing</span>
              </div>
              <div>
                <strong>2</strong>
                <span>Tailored journeys</span>
              </div>
            </div>
          </div>

          <div className="market-gallery">
            <div className="market-gallery-heading">
              <span>Choose your destination</span>
              <p>Availability, pricing and delivery guidance update with your selected market.</p>
            </div>

            <div className="market-journeys">
              <Link className="market-journey-card" href="/shop">
                <span className="market-journey-media">
                  <Image
                    src="/images/our-story-impact.webp"
                    alt="A Bangladeshi grower harvesting leafy crops in a sunlit field"
                    fill
                    sizes="(max-width: 760px) 86vw, 34vw"
                  />
                  <span className="market-card-kicker">
                    <MapPin size={15} aria-hidden="true" />
                    Bangladesh
                  </span>
                  <span className="market-card-number">01</span>
                </span>
                <span className="market-journey-body">
                  <span className="market-journey-title">
                    <strong>Shop locally in BDT</strong>
                    <span className="market-card-arrow" aria-hidden="true">
                      <ArrowUpRight size={18} />
                    </span>
                  </span>
                  <span className="market-journey-copy">
                    Products and gifts selected for supported destinations across Bangladesh.
                  </span>
                  <span className="market-journey-link">Enter the local shop</span>
                </span>
              </Link>

              <Link className="market-journey-card" href="/shop">
                <span className="market-journey-media">
                  <Image
                    src="/images/gifts/presentation-trio.jpg"
                    alt="Bangla Blend spice gift collections prepared for giving"
                    fill
                    sizes="(max-width: 760px) 86vw, 34vw"
                  />
                  <span className="market-card-kicker">
                    <Globe2 size={15} aria-hidden="true" />
                    International
                  </span>
                  <span className="market-card-number">02</span>
                </span>
                <span className="market-journey-body">
                  <span className="market-journey-title">
                    <strong>A taste of home, worldwide</strong>
                    <span className="market-card-arrow" aria-hidden="true">
                      <ArrowUpRight size={18} />
                    </span>
                  </span>
                  <span className="market-journey-copy">
                    Discover what is currently eligible for delivery to your selected country.
                  </span>
                  <span className="market-journey-link">Explore worldwide</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <WhyBanglaBlend />
    </>
  );
}
