import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  CreditCard,
  Handshake,
  Headphones,
  Leaf,
  PackageOpen,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import "./faq.css";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about Bangla Blend products, ingredients, delivery and wholesale.",
};

const faqs = [
  {
    id: "source-ingredients",
    question: "Where do you source your ingredients from?",
    answer:
      "We source our spices and ingredients from trusted farmers and suppliers across Bangladesh, known for their rich soil, ideal climate and age-old cultivation practices. Every ingredient is carefully selected for its purity, aroma and authenticity.",
  },
  {
    id: "natural-products",
    question: "Are your products 100% natural?",
    answer:
      "Ingredients and processing details are listed for each product. Please check the individual product page or pack label for the most accurate information about a particular blend.",
  },
  {
    id: "additives",
    question: "Do you use any preservatives or artificial additives?",
    answer:
      "We do not make one blanket claim across every item. Any additive or preservative required for a product will be declared in its ingredient list and on the pack label.",
  },
  {
    id: "vegetarian-products",
    question: "Are your products suitable for vegetarians?",
    answer:
      "Many Bangla Blend pantry products are vegetarian, but suitability can vary by recipe and product. Please use the dietary information on the product page and packaging as your guide.",
  },
  {
    id: "spice-storage",
    question: "How should I store the spices?",
    answer:
      "Keep spices sealed in a cool, dry place away from direct sunlight, heat and moisture. Always follow any product-specific storage instructions printed on the pack.",
  },
  {
    id: "shelf-life",
    question: "What is the shelf life of your products?",
    answer:
      "Shelf life varies by product. The best-before date on the pack is the authoritative guide, provided the product has been stored as directed.",
  },
  {
    id: "international-shipping",
    question: "Do you offer international shipping?",
    answer:
      "Bangladesh is our initial delivery market. International availability is opened market by market once the relevant delivery, payment and compliance arrangements are ready.",
  },
  {
    id: "returns",
    question: "Can I return or exchange a product?",
    answer:
      "Eligible returns and exchanges are handled under our Returns & Refunds policy. Contact customer care with your order number and photos if an item arrives damaged or incorrect.",
  },
  {
    id: "wholesale-pricing",
    question: "Do you offer bulk or wholesale pricing?",
    answer:
      "Yes, we welcome enquiries from restaurants, retailers, hospitality businesses and other approved partners. Pricing depends on the products, quantities and destination.",
  },
  {
    id: "stockist",
    question: "How can I become a stockist or distributor?",
    answer:
      "Send us a wholesale enquiry with information about your business, market, product interests and expected volumes. Our team will review the details and respond with the appropriate next steps.",
  },
] as const;

type FaqTopic = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const topics: FaqTopic[] = [
  { label: "Orders & Shipping", href: "/legal/shipping-policy", icon: Truck },
  { label: "Products & Ingredients", href: "#source-ingredients", icon: Leaf },
  { label: "Payments & Pricing", href: "#wholesale-pricing", icon: CreditCard },
  { label: "Returns & Refunds", href: "/legal/returns-refund-policy", icon: PackageOpen },
  { label: "Wholesale & Export", href: "/wholesale", icon: Handshake },
  { label: "Account & Support", href: "/account", icon: UserRound },
];

function FaqOrnament() {
  return (
    <span className="faq-ornament" aria-hidden="true">
      <span />
    </span>
  );
}

export default function FaqPage() {
  return (
    <div className="faq-page">
      <section className="faq-hero" aria-labelledby="faq-page-title">
        <PageContainer className="faq-hero-grid">
          <div className="faq-hero-copy">
            <Breadcrumbs items={[{ label: "FAQ" }]} />
            <h1 id="faq-page-title">FAQ</h1>
            <FaqOrnament />
            <p>Find answers to the most common questions about Bangla Blend and our products.</p>
          </div>
          <div className="faq-hero-media">
            <Image
              src="/images/our-story-hero.png"
              alt="Turmeric, dried chillies, mustard seed and aromatic spices from a Bangladeshi kitchen"
              fill
              priority
              sizes="(max-width: 780px) 100vw, 60vw"
            />
          </div>
        </PageContainer>
      </section>

      <PageContainer className="faq-content">
        <main className="faq-main" aria-labelledby="frequently-asked-title">
          <h2 id="frequently-asked-title">Frequently Asked Questions</h2>

          <div className="faq-accordion">
            {faqs.map((faq, index) => (
              <details id={faq.id} key={faq.id} open={index === 0}>
                <summary>
                  <span className="faq-question">
                    <span>{index + 1}.</span>
                    {faq.question}
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>

          <section className="faq-contact-card" aria-labelledby="faq-contact-title">
            <span className="faq-contact-icon" aria-hidden="true">
              <Headphones size={31} strokeWidth={1.45} />
            </span>
            <div>
              <h3 id="faq-contact-title">Still have questions?</h3>
              <p>
                We’re here to help! Reach out to our team and we’ll get back to you as soon as
                possible.
              </p>
            </div>
            <Link className="faq-button faq-button-solid" href="/contact">
              Contact us
              <span aria-hidden="true">→</span>
            </Link>
          </section>
        </main>

        <aside className="faq-sidebar" aria-label="More ways to find help">
          <nav className="faq-topic-card" aria-labelledby="browse-topics-title">
            <h2 id="browse-topics-title">Browse Topics</h2>
            <ul>
              {topics.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <Link href={href}>
                    <Icon size={24} strokeWidth={1.45} aria-hidden="true" />
                    <span>{label}</span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section className="faq-story-card" aria-labelledby="faq-story-title">
            <Image
              src="/images/our-story-craft.png"
              alt="Whole spices being ground by hand in a traditional stone mortar"
              fill
              sizes="(max-width: 780px) 100vw, 30vw"
            />
            <div className="faq-story-content">
              <h2 id="faq-story-title">
                Real ingredients.
                <br />
                Real stories.
                <br />
                Real Bangladesh.
              </h2>
              <p>Learn more about the people, places and purpose behind Bangla Blend.</p>
              <Link className="faq-button faq-button-solid" href="/our-story">
                Discover our story
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        </aside>
      </PageContainer>
    </div>
  );
}
