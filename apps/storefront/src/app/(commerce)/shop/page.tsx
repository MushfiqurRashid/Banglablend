import type { Metadata } from "next";
import { ShopPageView } from "@/components/commerce/shop-page-view";
import { getStoreProducts } from "@/lib/commerce/server";
import "../commerce.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop Bangla Blend Originals, Reserve ingredients, pantry essentials, tea, accessories and gifts.",
};

export default async function ShopPage() {
  const products = await getStoreProducts();

  return (
    <ShopPageView
      title="Shop"
      eyebrow="The complete collection"
      description="Explore regionally inspired spice blends, pantry essentials, teas and gifts rooted in Bangladesh’s diverse food traditions. Everything is thoughtfully sourced and made for everyday cooking."
      products={products}
    />
  );
}
