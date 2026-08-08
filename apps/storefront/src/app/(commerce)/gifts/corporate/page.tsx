import type { Metadata } from "next";
import { getStoreProducts } from "@/lib/commerce/server";
import { ProductGrid } from "@/components/commerce/product-grid";
import { CorporateGiftingForm } from "@/components/forms/corporate-gifting-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import "../../commerce.css";

export const metadata: Metadata = {
  title: "Corporate Gifting",
  description:
    "Explore Bangla Blend corporate gifts and request quantities, packaging, messages, and delivery support.",
};

export default async function CorporateGiftingPage() {
  const products = (await getStoreProducts()).filter(
    (product) => product.collection === "gifts" && product.giftType === "corporate",
  );

  return (
    <>
      <header className="page-hero">
        <PageContainer>
          <Breadcrumbs
            items={[{ label: "Gifts", href: "/gifts" }, { label: "Corporate Gifting" }]}
          />
          <span className="eyebrow">Thoughtful gifting at scale</span>
          <h1>Corporate Gifting</h1>
          <p className="lead">
            Choose a prepared Bangla Blend gift, then tell us about quantities, custom packaging,
            message cards, and delivery locations.
          </p>
        </PageContainer>
      </header>

      <Section>
        <PageContainer>
          <div className="section-heading">
            <span className="eyebrow">Corporate collection</span>
            <h2>Gift options for teams, clients, and occasions</h2>
            <p>
              Product prices show the available formats. Volume pricing and fulfillment are
              confirmed with your inquiry.
            </p>
          </div>
          {products.length ? (
            <ProductGrid products={products} />
          ) : (
            <div className="empty-state">
              <h3>Corporate products are being prepared</h3>
              <p>Send the brief below and our team can assemble an option for your occasion.</p>
            </div>
          )}
        </PageContainer>
      </Section>

      <Section>
        <PageContainer>
          <div className="section-heading">
            <span className="eyebrow">Request a proposal</span>
            <h2>Tell us what you need</h2>
          </div>
          <CorporateGiftingForm />
        </PageContainer>
      </Section>
    </>
  );
}
