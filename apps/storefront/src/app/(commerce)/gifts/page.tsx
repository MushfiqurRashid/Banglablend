import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarHeart,
  Gift,
  MessageSquareText,
  PackageCheck,
  Truck,
} from "lucide-react";
import { getStoreProducts } from "@/lib/commerce/server";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GiftCatalog } from "@/components/commerce/gift-catalog";
import { PageContainer } from "@/components/layout/page-container";
import "../commerce.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masala Gift Boxes",
  description:
    "Shop Bangla Blend spice gifts, regional masala collections and gift-ready pantry sets for cooks, hosts and celebrations.",
};

const giftServices = [
  {
    title: "Your note, included",
    copy: "Write a personal message at checkout and we will place it inside the box.",
    icon: MessageSquareText,
  },
  {
    title: "Prices stay hidden",
    copy: "Gift orders arrive without product prices on the packing slip.",
    icon: Gift,
  },
  {
    title: "Packed to delight",
    copy: "Each set is arranged in gift-ready packaging designed to be opened slowly.",
    icon: PackageCheck,
  },
  {
    title: "Delivery with care",
    copy: "Choose the recipient and delivery details separately during checkout.",
    icon: Truck,
  },
];

export default async function GiftsPage() {
  const products = (await getStoreProducts()).filter((product) => product.collection === "gifts");

  return (
    <div className="shop-landing gift-landing">
      <header className="shop-landing-hero gift-landing-hero">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Gifts" }]} />
          <div className="shop-hero-grid gift-hero-grid">
            <div className="shop-hero-copy gift-hero-copy">
              <span className="eyebrow">Masala gifts, made memorable</span>
              <h1>Give a whole pantry.</h1>
              <p>
                Bold Bangladeshi spice blends, gathered into gift-ready boxes for new homes,
                generous hosts, family celebrations and cooks who always make room at the table.
              </p>
              <div className="gift-hero-actions">
                <Link className="button button-primary" href="#gift-catalog">
                  Shop gift boxes
                </Link>
                <Link className="gift-secondary-link" href="/shop/build-a-box">
                  Build your own box <ArrowUpRight size={16} />
                </Link>
              </div>
              <ul className="gift-hero-promises" aria-label="Gift order benefits">
                <li>Personal note included</li>
                <li>No prices in the parcel</li>
                <li>Bangladesh, UK & US selection</li>
              </ul>
            </div>

            <div className="gift-hero-media">
              <Image
                src="/images/gifts-hero.png"
                alt="An open Bangla Blend gift box filled with spice tins, masala pouches and a brass spoon"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 58vw"
              />
              <div className="gift-hero-seal" aria-hidden="true">
                <span>Gift-ready</span>
                <strong>বাংলা স্বাদ</strong>
              </div>
            </div>
          </div>
        </PageContainer>
      </header>

      <GiftCatalog products={products} />

      <section className="shop-values" aria-label="Bangla Blend gifting service">
        <PageContainer className="shop-values-grid">
          {giftServices.map(({ title, copy, icon: Icon }) => (
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

      <section className="gift-corporate-section">
        <PageContainer className="gift-corporate-grid">
          <div className="gift-corporate-icon" aria-hidden="true">
            <CalendarHeart size={54} strokeWidth={1.15} />
          </div>
          <div>
            <span className="eyebrow">Gifting for teams & occasions</span>
            <h2>One thoughtful box—or a whole guest list.</h2>
            <p>
              Planning client gifts, wedding favours, team celebrations or an event? Tell us the
              quantity, budget and destinations. We will help shape a Bangla Blend collection that
              feels personal at every scale.
            </p>
          </div>
          <Link className="button button-secondary" href="/gifts/corporate">
            Plan a gift order <ArrowUpRight size={16} />
          </Link>
        </PageContainer>
      </section>
    </div>
  );
}
