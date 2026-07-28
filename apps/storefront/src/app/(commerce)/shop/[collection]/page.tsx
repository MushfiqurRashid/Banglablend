import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreProducts } from "@/lib/commerce/server";
import { ProductGrid } from "@/components/commerce/product-grid";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { titleFromSlug } from "@/lib/utils";
import "../../commerce.css";

const valid = ["all", "originals", "reserve", "pantry", "tea-wellness", "lifestyle-accessories", "best-sellers", "new-arrivals"] as const;
type Collection = (typeof valid)[number];
const descriptions: Record<Collection, string> = {
  all: "All products currently eligible for your delivery destination.",
  originals: "Signature, regionally inspired blends rooted in Bangladeshi dishes and cooking traditions.",
  reserve: "Limited-production and region-specific ingredients selected for provenance, flavor and cultural relevance.",
  pantry: "Everyday spices, pastes, salts and essentials for modern home kitchens.",
  "tea-wellness": "Tea, infusions and comforting blends inspired by Bangladeshi ingredients and everyday rituals.",
  "lifestyle-accessories": "Kitchen and lifestyle objects inspired by Bangladeshi craft, food culture and visual identity.",
  "best-sellers": "Customer favourites and signature Bangla Blend products available for your destination.",
  "new-arrivals": "The latest products added to the Bangla Blend collection for your destination."
};

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }): Promise<Metadata> {
  const { collection } = await params;
  return { title: collection === "all" ? "Shop All" : titleFromSlug(collection), description: descriptions[collection as Collection] ?? "Browse the Bangla Blend collection." };
}

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ collection: string }>; searchParams: Promise<{ sort?: string; availability?: string }> }) {
  const { collection } = await params;
  const query = await searchParams;
  if (!valid.includes(collection as Collection)) notFound();
  const allProducts = await getStoreProducts();
  let products = collection === "all" ? allProducts : allProducts.filter((product) => product.collection === collection);
  if (collection === "best-sellers") {
    products = allProducts.filter((product) => product.bestSeller === true);
  }
  if (collection === "new-arrivals") products = allProducts.filter((product) => product.createdAt).sort((a, b) => new Date(b.createdAt!).valueOf() - new Date(a.createdAt!).valueOf()).slice(0, 6);
  if (query.sort === "price-asc") products = [...products].sort((a, b) => (a.variants[0]?.price.amount ?? 0) - (b.variants[0]?.price.amount ?? 0));
  if (query.sort === "price-desc") products = [...products].sort((a, b) => (b.variants[0]?.price.amount ?? 0) - (a.variants[0]?.price.amount ?? 0));
  const title = collection === "all" ? "Shop all" : titleFromSlug(collection);
  return <><header className="page-hero"><PageContainer><Breadcrumbs items={[{ label: "Shop", href: "/shop" }, { label: title }]} /><span className="eyebrow">Collection</span><h1>{title}</h1><p className="lead">{descriptions[collection as Collection]}</p></PageContainer></header><PageContainer><div className="collection-toolbar"><p className="results-count">{products.length} products for your destination</p><form className="filter-form"><label className="field"><span className="field-label">Sort</span><select className="select" name="sort" defaultValue={query.sort ?? "featured"}><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label><button className="button button-secondary" type="submit">Apply</button></form></div></PageContainer><Section><PageContainer><ProductGrid products={products} /></PageContainer></Section></>;
}
