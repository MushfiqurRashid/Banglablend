import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveMarket, getStoreProduct, getStoreProducts } from "@/lib/commerce/server";
import { ProductGrid } from "@/components/commerce/product-grid";
import { ProductDetailView } from "@/components/commerce/product-detail-view";
import { ComingSoonPage } from "@/components/editorial/coming-soon-page";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { giftComingSoonPages } from "@/config/coming-soon";
import { titleFromSlug } from "@/lib/utils";
import "../../commerce.css";

const listingSlugs = new Set(["gift-sets", "regional-gifts", "all", "regional", "occasion"]);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const comingSoonPage = giftComingSoonPages[slug as keyof typeof giftComingSoonPages];
  if (comingSoonPage) {
    return {
      title: `${comingSoonPage.title} — Coming Soon`,
      description: comingSoonPage.description,
    };
  }
  if (listingSlugs.has(slug)) return { title: `${titleFromSlug(slug)} Gifts` };
  const product = await getStoreProduct(slug);
  return { title: product?.title ?? "Gift not found", description: product?.description, alternates: product ? { canonical: `/gifts/${product.handle}` } : undefined };
}

export default async function GiftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comingSoonPage = giftComingSoonPages[slug as keyof typeof giftComingSoonPages];
  if (comingSoonPage) return <ComingSoonPage {...comingSoonPage} />;
  if (listingSlugs.has(slug)) {
    const products = (await getStoreProducts()).filter((product) => product.collection === "gifts" && (slug === "regional-gifts" || slug === "regional" ? product.giftType === "regional" : true));
    const title = slug === "gift-sets" || slug === "all" ? "Gift sets" : slug === "regional-gifts" || slug === "regional" ? "Regional gifts" : "Occasion gifts";
    return <><header className="page-hero"><PageContainer><Breadcrumbs items={[{ label: "Gifts", href: "/gifts" }, { label: title }]} /><span className="eyebrow">Made to share</span><h1>{title}</h1><p className="lead">Recipient details, gift messages, hidden prices and delivery eligibility are confirmed during checkout.</p></PageContainer></header><Section><PageContainer><ProductGrid products={products} /></PageContainer></Section></>;
  }
  const [product, market, products] = await Promise.all([
    getStoreProduct(slug),
    getActiveMarket(),
    getStoreProducts()
  ]);
  if (!product || product.collection !== "gifts") notFound();
  const related = products
    .filter((item) => item.id !== product.id)
    .sort((left, right) => Number(right.collection === "gifts") - Number(left.collection === "gifts"))
    .slice(0, 4);

  return (
    <ProductDetailView
      product={product}
      market={market}
      related={related}
      breadcrumbs={[
        { label: "Gifts", href: "/gifts" },
        { label: product.title }
      ]}
      canonicalPath={`/gifts/${product.handle}`}
    />
  );
}
