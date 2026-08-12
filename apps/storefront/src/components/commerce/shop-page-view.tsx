import type { ReactNode } from "react";
import Image from "next/image";
import type { Product } from "@bangla-blend/types";
import { HandHeart, MapPin, ShieldCheck, Sprout } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { ShopCatalog } from "./shop-catalog";
import { ShopCategoryBand } from "./shop-category-band";

const shopValues = [
  {
    title: "Made in careful batches",
    copy: "Blended in considered quantities for freshness and full flavour.",
    icon: Sprout,
  },
  {
    title: "Rooted in Bangladesh",
    copy: "Inspired by regional ingredients and food traditions from across the country.",
    icon: MapPin,
  },
  {
    title: "No unnecessary additives",
    copy: "Clear ingredient information, with no unverified product claims.",
    icon: ShieldCheck,
  },
  {
    title: "Ethical & transparent",
    copy: "Built around dignified partnerships with farmers and makers.",
    icon: HandHeart,
  },
];

interface ShopPageViewProps {
  title: string;
  eyebrow: string;
  description: string;
  activeCategory?: string;
  products?: Product[];
  children?: ReactNode;
  heroImage?: string;
  heroImageAlt?: string;
}

export function ShopPageView({
  title,
  eyebrow,
  description,
  activeCategory,
  products,
  children,
  heroImage,
  heroImageAlt,
}: ShopPageViewProps) {
  const breadcrumbItems =
    title === "Shop"
      ? [{ label: "Shop" }]
      : [
          { label: "Shop", href: "/shop" },
          { label: title },
        ];

  return (
    <div className="shop-landing">
      <header className="shop-landing-hero">
        <PageContainer>
          <Breadcrumbs items={breadcrumbItems} />
          <div className="shop-hero-grid">
            <div className="shop-hero-copy">
              <span className="eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            <div className={heroImage ? "shop-hero-media catalog-hero-media" : "shop-hero-media"}>
              <Image
                src={heroImage || "/images/campaign/shop-signature-lineup.jpg"}
                alt={heroImageAlt || "Bangla Blend Cox's Bazar Fish Masala, Chatgaiya Mezban Masala and Shahi Garam Masala"}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 58vw"
                unoptimized={Boolean(heroImage?.startsWith("http"))}
              />
              <span>Three signatures · One Bangla pantry</span>
            </div>
          </div>
        </PageContainer>
      </header>

      <ShopCategoryBand activeCategory={activeCategory} />

      {children ?? (products ? <ShopCatalog products={products} /> : null)}

      <section className="shop-values" aria-label="Bangla Blend product standards">
        <PageContainer className="shop-values-grid">
          {shopValues.map(({ title: valueTitle, copy, icon: Icon }) => (
            <article className="shop-value" key={valueTitle}>
              <Icon size={28} strokeWidth={1.45} />
              <div>
                <h2>{valueTitle}</h2>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </PageContainer>
      </section>
    </div>
  );
}
