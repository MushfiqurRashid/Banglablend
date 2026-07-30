import type { Metadata } from "next";
import type { Product } from "@bangla-blend/types";
import { notFound } from "next/navigation";
import { ShopPageView } from "@/components/commerce/shop-page-view";
import { getStoreProducts } from "@/lib/commerce/server";
import "../../commerce.css";

export const dynamic = "force-dynamic";

const valid = [
  "all",
  "originals",
  "reserve",
  "pantry",
  "tea-wellness",
  "lifestyle-accessories",
  "best-sellers",
  "new-arrivals",
] as const;

type Collection = (typeof valid)[number];

const collectionContent: Record<
  Collection,
  { title: string; eyebrow: string; description: string }
> = {
  all: {
    title: "Shop All",
    eyebrow: "The complete collection",
    description:
      "Explore every Bangla Blend product currently available for your delivery destination.",
  },
  originals: {
    title: "Originals",
    eyebrow: "Signature Bangla blends",
    description:
      "Regionally inspired spice blends rooted in Bangladeshi dishes, food memories and everyday cooking traditions.",
  },
  reserve: {
    title: "Reserve",
    eyebrow: "Distinctive ingredients",
    description:
      "Limited release ingredients from selected regions, chosen for provenance, flavour and cultural relevance.",
  },
  pantry: {
    title: "Pantry",
    eyebrow: "Everyday essentials",
    description:
      "Spices, pastes, salts and practical essentials designed for a considered modern pantry.",
  },
  "tea-wellness": {
    title: "Tea & Wellness",
    eyebrow: "Everyday rituals",
    description:
      "Tea, infusions and comforting blends inspired by Bangladeshi ingredients and daily rituals.",
  },
  "lifestyle-accessories": {
    title: "Lifestyle Accessories",
    eyebrow: "For kitchen and table",
    description:
      "Kitchen and lifestyle objects inspired by Bangladeshi craft, food culture and visual identity.",
  },
  "best-sellers": {
    title: "Best Sellers",
    eyebrow: "Community favourites",
    description:
      "The signature Bangla Blend products customers return to most, gathered in one considered edit.",
  },
  "new-arrivals": {
    title: "New Arrivals",
    eyebrow: "Recently added",
    description:
      "Discover the newest spice blends, pantry pieces and thoughtful additions to the Bangla Blend collection.",
  },
};

function productsForCollection(products: Product[], collection: Collection) {
  if (collection === "all") return products;
  if (collection === "best-sellers") {
    return products.filter((product) => product.bestSeller === true);
  }
  if (collection === "new-arrivals") {
    return products
      .filter((product) => product.createdAt)
      .sort(
        (first, second) =>
          new Date(second.createdAt!).valueOf() - new Date(first.createdAt!).valueOf()
      )
      .slice(0, 6);
  }
  return products.filter((product) => product.collection === collection);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  const content = collectionContent[collection as Collection];

  return {
    title: content?.title ?? "Shop",
    description: content?.description ?? "Browse the Bangla Blend collection.",
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  if (!valid.includes(collection as Collection)) notFound();

  const selectedCollection = collection as Collection;
  const products = productsForCollection(await getStoreProducts(), selectedCollection);
  const content = collectionContent[selectedCollection];

  return (
    <ShopPageView
      title={content.title}
      eyebrow={content.eyebrow}
      description={content.description}
      activeCategory={selectedCollection}
      products={products}
    />
  );
}
