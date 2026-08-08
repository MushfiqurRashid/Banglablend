import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CookingPot,
  HandHeart,
  Heart,
  HeartHandshake,
  Leaf,
  MapPinned,
  PackageCheck,
  Scale,
  Sparkles,
  Sprout,
  Users,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import "./about-bangla-blend.css";

export const metadata: Metadata = {
  title: "About Bangla Blend",
  description:
    "Discover Bangla Blend’s mission, values and journey. We are rooted in Bangladesh’s regional flavours and committed to sharing its food heritage with the world.",
};

const missionValues = [
  {
    title: "Authentic",
    copy: "Rooted in tradition and crafted with a distinct Bangladeshi point of view.",
    icon: Leaf,
  },
  {
    title: "Responsible",
    copy: "Thoughtful sourcing and relationships built with dignity and care.",
    icon: HandHeart,
  },
  {
    title: "Pure",
    copy: "Purposeful blends made from carefully selected spices.",
    icon: Heart,
  },
  {
    title: "Impactful",
    copy: "Building a better tomorrow for the communities behind our food.",
    icon: Sprout,
  },
] as const;

const differences = [
  {
    title: "Made in careful batches",
    copy: "Made in limited quantities for freshness, attention and consistency.",
    icon: Scale,
  },
  {
    title: "Blended by hand with care",
    copy: "Balanced in small batches to bring depth and harmony to every dish.",
    icon: CookingPot,
  },
  {
    title: "100% natural",
    copy: "Pure spice blends with no unnecessary fillers or artificial colour.",
    icon: Leaf,
  },
  {
    title: "Sourced in Bangladesh",
    copy: "A collection inspired by the country’s growing regions and food cultures.",
    icon: MapPinned,
  },
  {
    title: "Guided by impact",
    copy: "A growing brand designed to create value for farmers, makers and communities.",
    icon: HeartHandshake,
  },
] as const;

const journey = [
  {
    year: "2022",
    title: "The seed",
    copy: "A simple mission took shape: bring authentic Bangladeshi spices to modern kitchens.",
    icon: Sprout,
  },
  {
    year: "2023",
    title: "Building relationships",
    copy: "We listened, learned and began forming relationships around regional food knowledge.",
    icon: Users,
  },
  {
    year: "2024",
    title: "Crafting with purpose",
    copy: "Our first blends were made in small batches to make confident cooking easier.",
    icon: CookingPot,
  },
  {
    year: "2025",
    title: "Growing together",
    copy: "The collection grew, bringing more regional flavours and stories to the table.",
    icon: PackageCheck,
  },
  {
    year: "The future",
    title: "Endless possibilities",
    copy: "Our journey continues with heritage at its roots and purpose shaping the way forward.",
    icon: Sparkles,
  },
] as const;

export default function AboutBanglaBlendPage() {
  return (
    <div className="about-brand-page">
      <PageContainer className="about-brand-breadcrumb">
        <Breadcrumbs items={[{ label: "About Bangla Blend" }]} />
      </PageContainer>

      <header className="about-brand-hero" aria-labelledby="about-brand-title">
        <PageContainer className="about-brand-hero-grid">
          <div className="about-brand-hero-copy">
            <span className="about-brand-kicker">About Bangla Blend</span>
            <h1 id="about-brand-title">
              More Than Spices.
              <span>It&apos;s Our Heritage.</span>
            </h1>
            <p>
              Bangla Blend is a celebration of Bangladesh, its soil, its people and its timeless
              flavours. We bring you spices that are pure, authentic and crafted with purpose.
            </p>
            <Link className="about-brand-button" href="/our-story/our-impact">
              Discover our impact
            </Link>
          </div>
          <div className="about-brand-hero-media">
            <Image
              src="/images/home-hero-hathajari.jpg"
              alt="Bangla Blend red chilli powder surrounded by whole spices and a Bengali meal"
              fill
              priority
              sizes="(max-width: 860px) 100vw, 60vw"
            />
          </div>
        </PageContainer>
      </header>

      <section className="about-brand-mission" aria-labelledby="about-mission-title">
        <PageContainer>
          <div className="about-brand-panel">
            <div className="about-brand-section-heading about-brand-section-heading-centered">
              <span>Our mission</span>
              <h2 id="about-mission-title">
                To honour Bangladesh&apos;s rich culinary heritage through exceptional spice blends
                that delight homes and inspire pride in every meal.
              </h2>
            </div>
            <div className="about-brand-value-grid">
              {missionValues.map(({ title, copy, icon: Icon }) => (
                <article key={title}>
                  <span className="about-brand-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="about-brand-founder" aria-labelledby="about-founder-title">
        <PageContainer className="about-brand-founder-grid">
          <div className="about-brand-founder-media">
            <Image
              src="/images/our-story-craft.webp"
              alt="Spices being ground by hand in a traditional stone mortar"
              fill
              sizes="(max-width: 860px) 100vw, 48vw"
            />
            <span>Crafted from memory, made for today.</span>
          </div>
          <div className="about-brand-founder-copy">
            <span className="about-brand-kicker">Founder&apos;s story</span>
            <h2 id="about-founder-title">A Personal Journey Back to Our Roots</h2>
            <p>
              Bangla Blend was born from a deep love for the flavours of home and a desire to bring
              back the authenticity that modern life can sometimes leave behind.
            </p>
            <p>
              From family kitchens to the farms across our land, this journey is about preserving
              our heritage and sharing it with the world, one thoughtful blend at a time.
            </p>
            <div className="about-brand-signature" aria-label="Founder">
              <strong>Nudrat Nawar</strong>
              <span>Founder, Bangla Blend</span>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="about-brand-difference" aria-labelledby="about-difference-title">
        <PageContainer>
          <div className="about-brand-panel">
            <div className="about-brand-section-heading about-brand-section-heading-centered">
              <span>What makes us different</span>
              <h2 id="about-difference-title">Care you can taste in every blend.</h2>
            </div>
            <div className="about-brand-difference-grid">
              {differences.map(({ title, copy, icon: Icon }) => (
                <article key={title}>
                  <span className="about-brand-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="about-brand-journey" aria-labelledby="about-journey-title">
        <PageContainer>
          <div className="about-brand-section-heading about-brand-section-heading-centered">
            <span>Our journey</span>
            <h2 id="about-journey-title">Rooted in Tradition. Inspired by Tomorrow.</h2>
          </div>
          <ol className="about-brand-timeline">
            {journey.map(({ year, title, copy, icon: Icon }) => (
              <li key={year}>
                <span className="about-brand-timeline-icon" aria-hidden="true">
                  <Icon />
                </span>
                <strong>{year}</strong>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </PageContainer>
      </section>

      <section className="about-brand-closing" aria-label="Our promise">
        <PageContainer>
          <div className="about-brand-closing-card">
            <span className="about-brand-closing-mark" aria-hidden="true">
              <Leaf />
            </span>
            <blockquote>
              We don&apos;t just sell spices.
              <span>We share our heritage, our stories and a piece of Bangladesh with every jar.</span>
            </blockquote>
            <span className="about-brand-seal">
              <Leaf aria-hidden="true" />
              <strong>The taste of</strong>
              Bangladesh
            </span>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
