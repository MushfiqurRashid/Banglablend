import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoxBuilder } from "@/components/commerce/box-builder";
import { ProductDetailView } from "@/components/commerce/product-detail-view";
import { ProductGrid } from "@/components/commerce/product-grid";
import { ComingSoonPage } from "@/components/editorial/coming-soon-page";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { giftComingSoonPages } from "@/config/coming-soon";
import {
  getActiveMarket,
  getStoreProduct,
  getStoreProducts,
  getStorefrontCatalogs,
} from "@/lib/commerce/server";
import { titleFromSlug } from "@/lib/utils";
import "../../commerce.css";

const listingSlugs = new Set(["gift-sets", "regional-gifts", "all", "regional", "occasion"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const catalog = (await getStorefrontCatalogs("gifts")).find((item) => item.handle === slug);
  if (catalog) {
    return {
      title: catalog.name,
      description: catalog.description,
      alternates: { canonical: `/gifts/${catalog.handle}` },
    };
  }
  const comingSoonPage = giftComingSoonPages[slug as keyof typeof giftComingSoonPages];
  if (comingSoonPage) {
    return {
      title: `${comingSoonPage.title} — Coming Soon`,
      description: comingSoonPage.description,
    };
  }
  if (listingSlugs.has(slug)) return { title: `${titleFromSlug(slug)} Gifts` };
  const product = await getStoreProduct(slug);
  return {
    title: product?.title ?? "Gift not found",
    description: product?.description,
    alternates: product ? { canonical: `/gifts/${product.handle}` } : undefined,
  };
}

export default async function GiftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalogs = await getStorefrontCatalogs("gifts");
  const catalog = catalogs.find((item) => item.handle === slug);

  if (catalog) {
    const products = (await getStoreProducts()).filter(
      (product) =>
        product.variants[0] &&
        product.catalogs?.some(
          (assignment) => assignment.section === "gifts" && assignment.handle === catalog.handle,
        ),
    );
    return (
      <>
        <header className="page-hero">
          <PageContainer>
            <Breadcrumbs items={[{ label: "Gifts", href: "/gifts" }, { label: catalog.name }]} />
            <span className="eyebrow">
              {catalog.experience === "build_a_box" ? "Made by you" : "Made to share"}
            </span>
            <h1>{catalog.name}</h1>
            <p className="lead">
              {catalog.description ||
                (catalog.experience === "build_a_box"
                  ? `Choose ${catalog.boxSize ?? 3} eligible products to create your own gift box.`
                  : "A considered selection from Bangla Blend.")}
            </p>
          </PageContainer>
        </header>
        <Section>
          <PageContainer>
            {catalog.experience === "build_a_box" ? (
              <BoxBuilder products={products} boxSize={catalog.boxSize} />
            ) : (
              <ProductGrid products={products} action="add-to-cart" />
            )}
          </PageContainer>
        </Section>
      </>
    );
  }

  const comingSoonPage = giftComingSoonPages[slug as keyof typeof giftComingSoonPages];
  if (comingSoonPage) return <ComingSoonPage {...comingSoonPage} />;
  if (listingSlugs.has(slug)) {
    const products = (await getStoreProducts()).filter(
      (product) =>
        product.collection === "gifts" &&
        (slug === "regional-gifts" || slug === "regional" ? product.giftType === "regional" : true),
    );
    const title =
      slug === "gift-sets" || slug === "all"
        ? "Gift sets"
        : slug === "regional-gifts" || slug === "regional"
          ? "Regional gifts"
          : "Occasion gifts";
    return (
      <>
        <header className="page-hero">
          <PageContainer>
            <Breadcrumbs items={[{ label: "Gifts", href: "/gifts" }, { label: title }]} />
            <span className="eyebrow">Made to share</span>
            <h1>{title}</h1>
            <p className="lead">
              Recipient details, gift messages, hidden prices and delivery eligibility are confirmed
              during checkout.
            </p>
          </PageContainer>
        </header>
        <Section>
          <PageContainer>
            <ProductGrid products={products} />
          </PageContainer>
        </Section>
      </>
    );
  }

  const [product, market, products] = await Promise.all([
    getStoreProduct(slug),
    getActiveMarket(),
    getStoreProducts(),
  ]);
  if (!product || product.collection !== "gifts") notFound();
  const related = products
    .filter((item) => item.id !== product.id)
    .sort(
      (left, right) => Number(right.collection === "gifts") - Number(left.collection === "gifts"),
    )
    .slice(0, 4);

  return (
    <ProductDetailView
      product={product}
      market={market}
      related={related}
      breadcrumbs={[{ label: "Gifts", href: "/gifts" }, { label: product.title }]}
      canonicalPath={`/gifts/${product.handle}`}
    />
  );
}
