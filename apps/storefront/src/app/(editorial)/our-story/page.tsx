import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  HandHeart,
  Heart,
  Leaf,
  Users,
  Utensils,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import "./our-story.css";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Meet Bangla Blend and explore the philosophy, people and impact commitments behind the brand.",
};

const storyTabs = [
  { label: "About Bangla Blend", id: "about-bangla-blend" },
  { label: "Our Philosophy", id: "our-philosophy" },
  { label: "Our Impact", id: "our-impact" },
  { label: "Meet Annapurna", id: "meet-annapurna" },
];

const principles = [
  {
    title: "Rooted in origin",
    copy: "We celebrate ingredients shaped by Bangladesh's rich soils, seasons and regional food cultures.",
    icon: Leaf,
  },
  {
    title: "Made with care",
    copy: "Blending in careful batches and thoughtful preparation guide how we develop every recipe.",
    icon: Heart,
  },
  {
    title: "Made to connect",
    copy: "Food can bring people together at home, across generations and around the world.",
    icon: Users,
  },
];

const storyCards = [
  {
    id: "our-impact",
    title: "Our Impact",
    image: "/images/campaign/chilli-sourcing.jpg",
    imageAlt: "A Bangladeshi grower gathering red chillies dried in the sun",
    copy: "We are building toward thoughtful partnerships, stronger support for traditional food heritage and meaningful opportunities in rural communities.",
    cta: "See our impact",
    href: "/our-story/our-impact",
    icon: HandHeart,
  },
  {
    id: "meet-annapurna",
    title: "Meet Annapurna",
    image: "/images/our-story-annapurna.webp",
    imageAlt: "An illustrated woman holding a bowl in a warm kitchen scene",
    copy: "Annapurna represents abundance, nourishment and the spirit of sharing food with love. That spirit is at the heart of Bangla Blend.",
    cta: "Meet Annapurna",
    href: "/our-story/meet-annapurna",
    icon: Utensils,
  },
  {
    id: "from-our-notes",
    title: "From Our Notes",
    image: "/images/our-story-notes.webp",
    imageAlt: "An open recipe notebook beside a cup of tea and whole spices",
    copy: "Thoughts from our kitchen table, including food stories, seasonal inspiration, new launches and everything we are discovering along the way.",
    cta: "Read our notes",
    href: "/journal",
    icon: BookOpen,
  },
];

export default function OurStoryPage() {
  return (
    <div className="our-story-page">
      <header className="story-hero" aria-labelledby="story-title">
        <PageContainer className="story-hero-layout">
          <div className="story-hero-copy">
            <Breadcrumbs items={[{ label: "Our Story" }]} />
            <h1 id="story-title">Our Story</h1>
            <p className="story-hero-lead">
              Bangla Blend is more than spices. It is a tribute to the flavours, people and
              traditions that make Bangladesh&apos;s food culture so rich and regionally varied.
            </p>
            <p className="story-hero-note">
              Explore the ideas, people and purpose behind everything we create.
            </p>
          </div>
          <div className="story-hero-media">
            <Image
              src="/images/our-story-hero.webp"
              alt="Bangladeshi spices, chillies and leaves arranged in handcrafted bowls"
              fill
              priority
              sizes="(max-width: 700px) 100vw, 58vw"
            />
          </div>
        </PageContainer>
      </header>

      <nav className="story-tabs" aria-label="Our Story sections">
        <PageContainer>
          <ul>
            {storyTabs.map((tab, index) => (
              <li key={tab.id}>
                <a
                  className={
                    index === 0 ? "story-tab-link story-tab-link-active" : "story-tab-link"
                  }
                  href={`#${tab.id}`}
                >
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </PageContainer>
      </nav>

      <section
        className="story-section story-about"
        id="about-bangla-blend"
        aria-labelledby="about-bangla-blend-title"
      >
        <PageContainer className="story-about-layout">
          <div className="story-about-copy">
            <h2 id="about-bangla-blend-title">About Bangla Blend</h2>
            <p>
              Bangla Blend began with a simple belief: Bangladesh&apos;s regional ingredients,
              recipes and stories deserve to be experienced, remembered and shared.
            </p>
            <p>
              From source to kitchen, we are building a collection of honest spices and blends made
              with care and a clear respect for origin.
            </p>
            <Link className="story-cta" href="/about-bangla-blend">
              Our journey
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="story-about-media">
            <Image
              src="/images/our-story-craft.webp"
              alt="Illustrative editorial scene of hands preparing spices with a stone mortar"
              fill
              sizes="(max-width: 700px) 100vw, (max-width: 900px) 50vw, 31vw"
            />
          </div>

          <ul className="story-principles">
            {principles.map(({ title, copy, icon: Icon }) => (
              <li key={title}>
                <span className="story-principle-icon">
                  <Icon size={28} strokeWidth={1.35} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </PageContainer>
      </section>

      <section
        className="story-section story-philosophy"
        id="our-philosophy"
        aria-labelledby="our-philosophy-title"
      >
        <PageContainer className="story-philosophy-layout">
          <div className="story-philosophy-media">
            <Image
              src="/images/bangladesh-river-landscape.webp"
              alt="Fields and palms beside a river at sunrise in Bangladesh"
              fill
              sizes="(max-width: 700px) 100vw, 51vw"
            />
          </div>
          <div className="story-philosophy-copy">
            <h2 id="our-philosophy-title">Our Philosophy</h2>
            <p>
              Great food begins with respect for the land, the ingredient and the hands that grow
              it. We believe flavour should be expressive, carefully made and meaningful.
            </p>
            <Link className="story-cta" href="/our-story/our-philosophy">
              Our philosophy
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </PageContainer>
      </section>

      <section className="story-card-section" aria-labelledby="story-card-section-title">
        <PageContainer>
          <h2 className="story-visually-hidden" id="story-card-section-title">
            Explore more of our story
          </h2>
          <div className="story-card-grid">
            {storyCards.map(({ id, title, image, imageAlt, copy, cta, href, icon: Icon }) => (
              <article className="our-story-card" id={id} key={id}>
                <span className="story-card-icon">
                  <Icon size={26} strokeWidth={1.35} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <div className="story-card-media">
                  <Image
                    src={image}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 700px) 100vw, (max-width: 900px) 50vw, 24vw"
                  />
                </div>
                <p>{copy}</p>
                <Link className="story-cta story-card-cta" href={href}>
                  {cta}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
