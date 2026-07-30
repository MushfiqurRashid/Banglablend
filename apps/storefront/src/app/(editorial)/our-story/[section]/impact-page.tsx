import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  CookingPot,
  Droplets,
  HandHeart,
  Handshake,
  Leaf,
  MapPinned,
  Package,
  PackageCheck,
  ScanSearch,
  Sprout,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";

const commitments = [
  {
    icon: Handshake,
    title: "Partner relationships",
    copy: "Built for continuity, respect and clearer records.",
  },
  {
    icon: ClipboardCheck,
    title: "Product clarity",
    copy: "Ingredients, sizes and practical guidance kept together.",
  },
  {
    icon: MapPinned,
    title: "Regional context",
    copy: "Food traditions connected to place with care.",
  },
  {
    icon: PackageCheck,
    title: "Thoughtful production",
    copy: "Careful attention from ingredient to finished jar.",
  },
] as const;

const workStories = [
  {
    title: "Ingredients in context",
    kicker: "Field notes",
    copy: "Regional ingredients deserve accurate records and stories grounded in the food they help create.",
    image: "/images/our-story-impact.png",
    alt: "A Bangladeshi farmer harvesting leafy crops in a sunlit field",
  },
  {
    title: "Knowledge carried forward",
    kicker: "Food heritage",
    copy: "Traditional preparation knowledge gives every blend a richer and more useful point of view.",
    image: "/images/campaign/chilli-sourcing.jpg",
    alt: "A Bangladeshi grower gathering red chillies laid out to dry",
  },
  {
    title: "Craft made visible",
    kicker: "From the kitchen",
    copy: "Clear process and practical cooking guidance connect careful craft with confident everyday use.",
    image: "/images/our-story-craft.png",
    alt: "Hands grinding whole spices with a traditional stone mortar",
  },
] as const;

const processSteps = [
  {
    icon: Sprout,
    number: "01",
    title: "Ingredient intake",
    copy: "Product and supplier records begin before an ingredient enters the blending process.",
  },
  {
    icon: Droplets,
    number: "02",
    title: "Cleaning",
    copy: "Ingredients are inspected and prepared with attention to cleanliness and consistency.",
  },
  {
    icon: CookingPot,
    number: "03",
    title: "Processing & blending",
    copy: "Recipes are processed and blended in measured batches to protect their intended character.",
  },
  {
    icon: Package,
    number: "04",
    title: "Packing",
    copy: "Finished products are packed with their size, storage and usage guidance close at hand.",
  },
] as const;

const glimpses = [
  {
    image: "/images/bangladesh-river-landscape.png",
    alt: "River, farmland and palms in rural Bangladesh at sunrise",
  },
  {
    image: "/images/campaign/chilli-sourcing.jpg",
    alt: "Red chillies being gathered after drying",
  },
  {
    image: "/images/our-story-impact.png",
    alt: "Leafy crops being harvested in a Bangladeshi field",
  },
  {
    image: "/images/our-story-craft.png",
    alt: "Whole spices being ground in a stone mortar",
  },
  {
    image: "/images/campaign/pantry-lineup.jpg",
    alt: "Bangla Blend jars arranged with whole spices",
  },
  {
    image: "/images/products/hathazari-red-chilli-lifestyle.jpg",
    alt: "Hathazari red chilli powder surrounded by dried chillies and spices",
  },
] as const;

const principles = [
  {
    icon: ScanSearch,
    title: "Documentation first",
    copy: "We separate ambition from evidence and publish specific claims only when the supporting record is ready.",
  },
  {
    icon: BookOpen,
    title: "Preserving food context",
    copy: "Recipes, regional knowledge and practical guidance keep products connected to the dishes behind them.",
  },
  {
    icon: Leaf,
    title: "Responsible growth",
    copy: "We are building the processes needed to assess partnerships, production choices and progress over time.",
  },
] as const;

export function ImpactPage() {
  return (
    <div className="impact-page">
      <section className="impact-page-hero" aria-labelledby="impact-page-title">
        <PageContainer className="impact-page-hero-layout">
          <div className="impact-page-hero-copy">
            <Breadcrumbs
              items={[
                { label: "Our Story", href: "/our-story" },
                { label: "Our Impact" },
              ]}
            />
            <span className="impact-page-eyebrow">Heritage · Craft · Progress</span>
            <h1 id="impact-page-title">Our Impact</h1>
            <p>
              At Bangla Blend, every product carries a responsibility: to respect regional food
              knowledge, keep product information clear and build partnerships with care.
            </p>
            <p>
              We are developing the records and working practices needed to make progress visible
              over time.
            </p>
            <Link className="impact-page-button impact-page-button-primary" href="#cleaning-processing">
              Explore how we work
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="impact-page-hero-media">
            <Image
              src="/images/our-story-impact.png"
              alt="A Bangladeshi farmer harvesting leafy crops in a sunlit field"
              fill
              priority
              sizes="(max-width: 820px) 100vw, 58vw"
            />
          </div>
        </PageContainer>
      </section>

      <section className="impact-commitment-band" aria-label="Our impact commitments">
        <PageContainer className="impact-commitment-grid">
          {commitments.map(({ icon: Icon, title, copy }) => (
            <article key={title}>
              <span className="impact-round-icon">
                <Icon size={23} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </PageContainer>
      </section>

      <section className="impact-work-section">
        <PageContainer>
          <header className="impact-centered-heading">
            <span className="impact-page-eyebrow">Stories behind the work</span>
            <h2>From ingredient to kitchen</h2>
            <p>Three perspectives on the care, context and craft we are building around every jar.</p>
          </header>
          <div className="impact-story-grid">
            {workStories.map((story) => (
              <article className="impact-story-card" key={story.title}>
                <div className="impact-story-media">
                  <Image src={story.image} alt={story.alt} fill sizes="(max-width: 720px) 100vw, 33vw" />
                </div>
                <div className="impact-story-copy">
                  <span>{story.kicker}</span>
                  <h3>{story.title}</h3>
                  <p>{story.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>

      <section
        className="impact-process-section"
        id="cleaning-processing"
        aria-labelledby="cleaning-processing-title"
      >
        <PageContainer>
          <header className="impact-centered-heading impact-process-heading">
            <span className="impact-page-eyebrow">From ingredient to jar</span>
            <h2 id="cleaning-processing-title">Cleaning and Processing</h2>
            <p>
              A clear sequence designed to protect product character and make every stage easier
              to understand.
            </p>
          </header>
          <ol className="impact-process-grid">
            {processSteps.map(({ icon: Icon, number, title, copy }) => (
              <li key={title}>
                <span className="impact-process-icon">
                  <Icon size={27} strokeWidth={1.4} aria-hidden="true" />
                </span>
                <span className="impact-process-number">{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </PageContainer>
      </section>

      <section className="impact-glimpses-section">
        <PageContainer>
          <header className="impact-centered-heading">
            <span className="impact-page-eyebrow">A closer look</span>
            <h2>Glimpses from the field</h2>
          </header>
          <div className="impact-glimpse-grid">
            {glimpses.map((glimpse) => (
              <div className="impact-glimpse" key={glimpse.image}>
                <Image src={glimpse.image} alt={glimpse.alt} fill sizes="(max-width: 700px) 50vw, 17vw" />
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="impact-principles-section">
        <PageContainer>
          <header className="impact-centered-heading">
            <span className="impact-page-eyebrow">Our approach</span>
            <h2>How we create impact</h2>
          </header>
          <div className="impact-principle-grid">
            {principles.map(({ icon: Icon, title, copy }) => (
              <article key={title}>
                <span className="impact-round-icon">
                  <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="impact-together-section" aria-labelledby="stronger-together-title">
        <PageContainer className="impact-together-layout">
          <span className="impact-together-icon">
            <HandHeart size={38} strokeWidth={1.4} aria-hidden="true" />
          </span>
          <div>
            <span className="impact-page-eyebrow">Partnership with purpose</span>
            <h2 id="stronger-together-title">Stronger Together for a Better Tomorrow</h2>
            <p>
              Lasting progress takes clear expectations, thoughtful collaboration and room to
              learn. Let&apos;s build the next chapter together.
            </p>
          </div>
          <Link className="impact-page-button impact-page-button-secondary" href="/contact">
            Collaborate with us
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </PageContainer>
      </section>
    </div>
  );
}
