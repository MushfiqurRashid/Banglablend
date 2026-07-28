import type { Metadata } from "next";
import { getStoreProducts } from "@/lib/commerce/server";
import { BoxBuilder } from "@/components/commerce/box-builder";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import "../../commerce.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Build a Box", description: "Choose three Bangla Blend products and create your own box." };

export default async function BuildABoxPage() {
  const products = (await getStoreProducts()).filter((product) => product.collection !== "gifts" && product.variants[0]);
  return <><header className="page-hero"><PageContainer><Breadcrumbs items={[{ label: "Shop", href: "/shop" }, { label: "Build a Box" }]} /><span className="eyebrow">Made by you</span><h1>Build a Box</h1><p className="lead">Choose three products for a personal pantry edit or a thoughtful gift. Each item remains visible in your bag so quantities, availability and delivery can be checked clearly.</p></PageContainer></header><Section><PageContainer><BoxBuilder products={products} /></PageContainer></Section></>;
}
