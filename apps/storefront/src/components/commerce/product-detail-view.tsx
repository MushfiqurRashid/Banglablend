import Link from "next/link";
import {
  BadgeCheck,
  Box,
  Check,
  Leaf,
  MapPin,
  PackageCheck,
  Scale,
  ShieldCheck,
  Star,
  Truck
} from "lucide-react";
import type { Market, Product } from "@bangla-blend/types";
import { ProductGallery } from "./product-gallery";
import { ProductInformationTabs } from "./product-information-tabs";
import { ProductPurchase } from "./product-purchase";
import { ProductRecommendationCard } from "./product-recommendation-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { WhyBanglaBlend } from "@/components/marketing/why-bangla-blend";
import { siteConfig } from "@/config/site";
import {
  formatCollection,
  getProductHighlights,
  getProductMedia,
  getProductUsage
} from "@/lib/product-presentation";

interface ProductDetailViewProps {
  product: Product;
  market: Market;
  related: Product[];
  breadcrumbs: Array<{ label: string; href?: string }>;
  canonicalPath: string;
}

export function ProductDetailView({
  product,
  market,
  related,
  breadcrumbs,
  canonicalPath
}: ProductDetailViewProps) {
  const media = getProductMedia(product);
  const highlights = getProductHighlights(product);
  const collectionLabel = formatCollection(product.collection);
  const regionLabel = product.region ?? "Bangladesh";
  const ingredientCopy = product.ingredients ?? "Ingredient details are awaiting verified product data.";
  const storageCopy = [
    product.storage ?? "Keep sealed in a cool, dry place and follow the final pack instructions.",
    product.shelfLife
  ].filter(Boolean).join(" ");
  const shippingCopy = market.domestic
    ? "Domestic delivery options are calculated at checkout. Return eligibility is confirmed against the final order."
    : `${market.dutiesMessage} Delivery and return eligibility are confirmed at checkout.`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: media.map((item) => new URL(item.url, siteConfig.url).toString()),
    sku: product.variants[0]?.sku,
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      price: variant.price.amount,
      priceCurrency: variant.price.currencyCode,
      ...(variant.inventoryQuantity === undefined
        ? {}
        : {
            availability:
              variant.inventoryQuantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock"
          }),
      url: `${siteConfig.url}${canonicalPath}`
    }))
  };
  const featureItems = [
    { icon: BadgeCheck, label: product.badges[0] ?? "Catalog details" },
    { icon: MapPin, label: regionLabel },
    { icon: Scale, label: `${product.variants.length} ${product.variants.length === 1 ? "size" : "sizes"}` },
    { icon: Box, label: collectionLabel }
  ];

  return (
    <div className="product-detail-page">
      <PageContainer>
        <div className="pdp-breadcrumbs">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        <section className="pdp-hero" aria-labelledby="product-title">
          <div className="pdp-gallery-column">
            <ProductGallery media={media} title={product.title} />
            <div className="pdp-service-strip" aria-label="Shopping information">
              <div>
                <Truck size={20} />
                <span>
                  <strong>Shipping options</strong>
                  <small>{market.domestic ? "Calculated at checkout" : `Available for ${market.label}`}</small>
                </span>
              </div>
              <div>
                <ShieldCheck size={20} />
                <span><strong>Secure checkout</strong><small>Payment confirmed before dispatch</small></span>
              </div>
              <div>
                <PackageCheck size={20} />
                <span><strong>Packed with care</strong><small>Stock checked when added</small></span>
              </div>
            </div>
          </div>

          <div className="pdp-summary">
            <span className="pdp-kicker">{collectionLabel}</span>
            <h1 id="product-title">{product.title}</h1>
            {product.subtitle ? <p className="pdp-subtitle">{product.subtitle}</p> : null}

            <div className="pdp-feature-row">
              {featureItems.map(({ icon: Icon, label }) => (
                <div key={label}>
                  <span><Icon size={17} /></span>
                  <small>{label}</small>
                </div>
              ))}
            </div>

            <div className="pdp-review-status" aria-label="No published reviews">
              <span aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} />)}
              </span>
              <small>No published reviews</small>
            </div>

            <ProductPurchase
              variants={product.variants}
              previewOnly={product.isPlaceholder === true}
              productTitle={product.title}
            />
          </div>
        </section>

        <section className="pdp-lower" aria-label="Product details and recommendations">
          <div className="pdp-lower-main">
            <div className="pdp-information-grid">
              <ProductInformationTabs
                description={product.description}
                ingredients={ingredientCopy}
                usage={getProductUsage(product)}
                storage={storageCopy}
                shipping={shippingCopy}
              />

              <aside className="pdp-love-card">
                <h2>Why you&apos;ll love it</h2>
                <ul>
                  {highlights.map((highlight) => (
                    <li key={highlight}><Check size={15} /><span>{highlight}</span></li>
                  ))}
                </ul>
              </aside>
            </div>

            {related.length ? (
              <section className="pdp-recommendations" aria-labelledby="recommendations-title">
                <div className="pdp-recommendation-heading">
                  <h2 id="recommendations-title">You may also like</h2>
                  <Link href="/shop">View all</Link>
                </div>
                <div className="pdp-recommendation-grid">
                  {related.map((item) => <ProductRecommendationCard key={item.id} product={item} />)}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="pdp-trust-card" aria-label="Bangla Blend product standards">
            <div>
              <Leaf size={37} />
              <span>
                <strong>{product.verified ? "Details with care" : "Verification first"}</strong>
                <small>
                  {product.verified
                    ? "The product record is published from verified catalog details."
                    : "Origin and formulation claims stay unpublished until verified."}
                </small>
              </span>
            </div>
            <div>
              <PackageCheck size={37} />
              <span>
                <strong>Made for real kitchens</strong>
                <small>Sizes and practical use guidance stay close at hand.</small>
              </span>
            </div>
            <div>
              <MapPin size={37} />
              <span>
                <strong>Rooted in Bangladesh</strong>
                <small>The catalog story is connected to {regionLabel}.</small>
              </span>
            </div>
          </aside>
        </section>
      </PageContainer>

      <WhyBanglaBlend />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
