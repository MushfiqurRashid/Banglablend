import type { Metadata } from "next";
import { BoxBuilder } from "@/components/commerce/box-builder";
import { ShopPageView } from "@/components/commerce/shop-page-view";
import { PageContainer } from "@/components/layout/page-container";
import { getStoreProducts } from "@/lib/commerce/server";
import "../../commerce.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build a Box",
  description: "Choose three Bangla Blend products and create your own box.",
};

export default async function BuildABoxPage() {
  const products = (await getStoreProducts()).filter(
    (product) => product.collection !== "gifts" && product.variants[0]
  );

  return (
    <ShopPageView
      title="Build a Box"
      eyebrow="Made by you"
      description="Choose three products for a personal pantry edit or a thoughtful gift. Every selection remains visible in your bag so availability and delivery stay clear."
      activeCategory="build-a-box"
    >
      <section className="shop-catalog-section">
        <PageContainer>
          <BoxBuilder products={products} />
        </PageContainer>
      </section>
    </ShopPageView>
  );
}
