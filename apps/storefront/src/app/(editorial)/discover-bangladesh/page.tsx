import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CookingPot,
  Heart,
  Landmark,
  Leaf,
  MapPin,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { DiscoverFeaturedStories } from "./discover-featured-stories";
import "../editorial.css";
import "./discover.css";

export const metadata: Metadata = {
  title: "Discover Bangladesh",
  description:
    "Explore the food heritage, regional flavours, ingredients, growers, cooking traditions and seasons of Bangladesh.",
};

type Topic = {
  title: string;
  description: string;
  href: string;
  image: string;
  imageAlt: string;
  action: string;
  icon: LucideIcon;
  imagePosition?: string;
};

const topics: Topic[] = [
  {
    title: "Food Heritage",
    description: "Discover the history, influences and evolution of Bengali food through time.",
    href: "/discover-bangladesh/food-heritage",
    image: "/images/our-story-craft.png",
    imageAlt: "Spices being ground by hand in a traditional stone mortar",
    action: "Explore stories",
    icon: Landmark,
    imagePosition: "center 61%",
  },
  {
    title: "Regional Flavours",
    description:
      "Iconic dishes and food traditions that define the unique character of our regions.",
    href: "/discover-bangladesh/regional-flavours",
    image: "/images/bangladesh-river-landscape.png",
    imageAlt: "A river winding through the green landscape of Bangladesh",
    action: "Explore stories",
    icon: MapPin,
    imagePosition: "center 57%",
  },
  {
    title: "Ingredient Stories",
    description:
      "The origins, characteristics and cultural significance of the ingredients we love.",
    href: "/discover-bangladesh/ingredient-stories",
    image: "/images/our-story-standards.png",
    imageAlt: "Bangladeshi spices arranged in brass and earthen bowls",
    action: "Explore stories",
    icon: Leaf,
  },
  {
    title: "Farmer & Sourcing Stories",
    description: "Meet the people behind our ingredients and learn how we source with care.",
    href: "/discover-bangladesh/farmer-sourcing-stories",
    image: "/images/campaign/chilli-sourcing.jpg",
    imageAlt: "A Bangladeshi grower gathering red chillies dried in the sun",
    action: "Explore stories",
    icon: Sprout,
    imagePosition: "center 54%",
  },
  {
    title: "Cooking Guides",
    description:
      "Practical guides, techniques and tips to help you cook with confidence and bring out the best flavours.",
    href: "/discover-bangladesh/cooking-guides",
    image: "/images/shorisha-ilish-recipe.png",
    imageAlt: "Shorisha ilish served in a traditional dark earthen bowl",
    action: "Explore guides",
    icon: CookingPot,
    imagePosition: "center 55%",
  },
  {
    title: "Festivals & Seasons",
    description:
      "Celebrate the seasons and special occasions with traditional foods and timeless recipes.",
    href: "/discover-bangladesh/festivals-seasons",
    image: "/images/recipe-masala-chai.png",
    imageAlt: "Two warm cups of spiced tea with ginger and whole spices",
    action: "Explore stories",
    icon: CalendarDays,
    imagePosition: "center 48%",
  },
  {
    title: "Behind Bangla Blend",
    description:
      "Go behind the scenes of Bangla Blend and meet the people behind our process and passion for regional food.",
    href: "/discover-bangladesh/behind-bangla-blend",
    image: "/images/campaign/pantry-lineup.jpg",
    imageAlt: "A full lineup of Bangla Blend masala jars made in small batches",
    action: "Explore stories",
    icon: Heart,
    imagePosition: "center",
  },
];

export default function DiscoverBangladeshPage() {
  return (
    <div className="discover-page">
      <section className="discover-hero" aria-labelledby="discover-page-title">
        <PageContainer className="discover-hero-layout">
          <div className="discover-hero-copy">
            <Breadcrumbs items={[{ label: "Discover Bangladesh" }]} />
            <h1 id="discover-page-title">Discover Bangladesh</h1>
            <span className="discover-title-rule" aria-hidden="true" />
            <p>
              From centuries of food heritage to the people and ingredients that shape our kitchens
              today. Explore the stories, traditions and techniques that make Bangladeshi food so
              rich and diverse.
            </p>
          </div>
          <div className="discover-hero-media">
            <Image
              src="/images/our-story-hero.png"
              alt="Dried chillies, turmeric, mustard seed and aromatic spices from a Bangladeshi kitchen"
              fill
              priority
              sizes="(max-width: 820px) 100vw, 58vw"
            />
          </div>
        </PageContainer>
      </section>

      <section className="discover-featured-section" aria-labelledby="featured-stories-title">
        <PageContainer>
          <header className="discover-section-heading">
            <h2 id="featured-stories-title">Featured Stories</h2>
            <span aria-hidden="true" />
          </header>
          <DiscoverFeaturedStories />
        </PageContainer>
      </section>

      <section className="discover-topics-section" aria-labelledby="explore-topics-title">
        <PageContainer>
          <header className="discover-section-heading">
            <h2 id="explore-topics-title">Explore by Topic</h2>
            <span aria-hidden="true" />
          </header>

          <div className="discover-topic-grid">
            {topics.map((topic) => {
              const Icon = topic.icon;
              return (
                <article className="discover-topic-card" key={topic.href}>
                  <div className="discover-topic-media">
                    <Image
                      src={topic.image}
                      alt={topic.imageAlt}
                      fill
                      sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
                      style={
                        topic.imagePosition ? { objectPosition: topic.imagePosition } : undefined
                      }
                    />
                    <span className="discover-topic-icon" aria-hidden="true">
                      <Icon size={25} strokeWidth={1.6} />
                    </span>
                  </div>
                  <div className="discover-topic-body">
                    <h3>{topic.title}</h3>
                    <p>{topic.description}</p>
                    <Link href={topic.href} className="discover-outline-link">
                      {topic.action}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
