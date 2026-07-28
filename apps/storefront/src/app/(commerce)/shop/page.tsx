import type { Metadata } from "next";
import Image from "next/image";
import { HandHeart, MapPin, ShieldCheck, Sprout } from "lucide-react";
import { getStoreProducts } from "@/lib/commerce/server";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { ShopCatalog } from "@/components/commerce/shop-catalog";
import "../commerce.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop Bangla Blend Originals, Reserve ingredients, pantry essentials, tea, accessories and gifts.",
};

const shopValues = [
  {
    title: "Small-batch made",
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

export default async function ShopPage() {
  const products = await getStoreProducts();

  return (
    <div className="shop-landing">
      <header className="shop-landing-hero">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Shop" }]} />
          <div className="shop-hero-grid">
            <div className="shop-hero-copy">
              <span className="eyebrow">The complete collection</span>
              <h1>Shop</h1>
              <p>
                Explore regionally inspired spice blends, pantry essentials, teas and gifts rooted
                in Bangladesh&apos;s diverse food traditions—thoughtfully sourced and made for
                everyday cooking.
              </p>
            </div>
            <div className="shop-hero-media">
              <Image
                src="/images/campaign/shop-signature-lineup.jpg"
                alt="Bangla Blend Cox's Bazar Fish Masala, Chatgaiya Mezban Masala and Shahi Garam Masala"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 58vw"
              />
              <span>Three signatures · One Bangla pantry</span>
            </div>
          </div>
        </PageContainer>
      </header>

      <ShopCatalog products={products} />

      <section className="shop-values" aria-label="Bangla Blend product standards">
        <PageContainer className="shop-values-grid">
          {shopValues.map(({ title, copy, icon: Icon }) => (
            <article className="shop-value" key={title}>
              <Icon size={28} strokeWidth={1.45} />
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </PageContainer>
      </section>
    </div>
  );
}
