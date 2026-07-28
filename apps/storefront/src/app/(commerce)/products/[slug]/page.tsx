import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/commerce/product-detail-view";
import { getActiveMarket, getStoreProduct, getStoreProducts } from "@/lib/commerce/server";
import { getProductMedia } from "@/lib/product-presentation";
import "../../commerce.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProduct(slug);
  if (!product) return { title: "Product not found" };
  const media = getProductMedia(product)[0];

  return {
    title: product.title,
    description: product.subtitle ?? product.description,
    alternates: { canonical: `/products/${product.handle}` },
    openGraph: {
      title: product.title,
      description: product.description,
      type: "website",
      images: media ? [{ url: media.url, alt: media.alt }] : undefined
    }
  };
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, market, products] = await Promise.all([
    getStoreProduct(slug),
    getActiveMarket(),
    getStoreProducts()
  ]);

  if (!product) notFound();

  const related = products
    .filter((item) => item.id !== product.id)
    .sort((left, right) => Number(right.collection === product.collection) - Number(left.collection === product.collection))
    .slice(0, 4);

  return (
    <ProductDetailView
      product={product}
      market={market}
      related={related}
      breadcrumbs={[
        { label: "Shop", href: "/shop" },
        { label: product.collection, href: `/shop/${product.collection}` },
        { label: product.title }
      ]}
      canonicalPath={`/products/${product.handle}`}
    />
  );
}
