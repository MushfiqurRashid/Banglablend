import type { Metadata } from "next";
import type { StorefrontSection } from "@bangla-blend/types";
import { notFound, redirect } from "next/navigation";
import { BoxBuilder } from "@/components/commerce/box-builder";
import { ProductGrid } from "@/components/commerce/product-grid";
import { ShopPageView } from "@/components/commerce/shop-page-view";
import { PageContainer } from "@/components/layout/page-container";
import { getStoreProducts, getStorefrontCatalogs } from "@/lib/commerce/server";
import { getCustomerSession } from "@/lib/auth/server";
import "../../../commerce.css";

// These nested categories are controlled by the separate admin app, so they must reflect creates,
// moves, deactivations, and deletions without retaining a stale full-route cache entry.
export const dynamic = "force-dynamic";

const shopSections: StorefrontSection[] = [
  "originals",
  "reserve",
  "pantry",
  "tea-wellness",
  "lifestyle-accessories",
];

async function findCatalog(collection: string, handle: string) {
  if (collection === "gifts") redirect(`/gifts/${handle}`);
  if (!shopSections.includes(collection as StorefrontSection)) return undefined;
  const catalogs = await getStorefrontCatalogs(collection as StorefrontSection);
  return catalogs.find((catalog) => catalog.handle === handle);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string; catalog: string }>;
}): Promise<Metadata> {
  const { collection, catalog: handle } = await params;
  const catalog = await findCatalog(collection, handle);
  return {
    title: catalog?.name ?? "Catalog not found",
    description: catalog?.description,
    alternates: catalog ? { canonical: `/shop/${collection}/${catalog.handle}` } : undefined,
  };
}

export default async function StorefrontCatalogPage({
  params,
}: {
  params: Promise<{ collection: string; catalog: string }>;
}) {
  const { collection, catalog: handle } = await params;
  const catalog = await findCatalog(collection, handle);
  if (!catalog) notFound();

  const [products, customer] = await Promise.all([
    getStoreProducts().then((all) =>
      all.filter(
        (product) =>
          product.variants[0] &&
          product.catalogs?.some(
            (assignment) =>
              assignment.section === catalog.section && assignment.handle === catalog.handle,
          ),
      ),
    ),
    getCustomerSession(),
  ]);

  return (
    <ShopPageView
      title={catalog.name}
      eyebrow={catalog.experience === "build_a_box" ? "Made by you" : "Curated catalog"}
      description={catalog.description || "A considered selection from Bangla Blend."}
      activeCategory={catalog.section}
      heroImage={catalog.heroImage}
      heroImageAlt={catalog.heroImageAlt || catalog.name}
    >
      <section className="shop-catalog-section">
        <PageContainer>
          {catalog.experience === "build_a_box" ? (
            <BoxBuilder products={products} boxSize={catalog.boxSize} catalogId={catalog.id} isSignedIn={Boolean(customer)} />
          ) : (
            <ProductGrid products={products} action="add-to-cart" />
          )}
        </PageContainer>
      </section>
    </ShopPageView>
  );
}
