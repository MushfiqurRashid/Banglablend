import type { Metadata } from "next";
import Link from "next/link";
import { Gift, PackageOpen } from "lucide-react";
import { GiftCatalog } from "@/components/commerce/gift-catalog";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { getStoreProducts, getStorefrontCatalogs } from "@/lib/commerce/server";
import "../commerce.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gifts",
  description: "Gift sets, regional selections and build-your-own boxes from Bangla Blend.",
};

export default async function GiftsPage() {
  const [products, catalogs] = await Promise.all([
    getStoreProducts(),
    getStorefrontCatalogs("gifts"),
  ]);
  const gifts = products.filter((product) => product.collection === "gifts");

  return (
    <div className="shop-landing">
      <header className="page-hero">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Gifts" }]} />
          <span className="eyebrow">Made to share</span>
          <h1>Gifts</h1>
          <p className="lead">
            Choose a ready-made gift or build a box from the products assigned by our catalog team.
            Delivery eligibility is checked for your selected market.
          </p>
        </PageContainer>
      </header>

      {catalogs.length ? (
        <section className="shop-category-band" aria-label="Gift catalogs">
          <PageContainer className="shop-category-shortcuts gift-category-shortcuts">
            {catalogs.map((catalog) => {
              const Icon = catalog.experience === "build_a_box" ? PackageOpen : Gift;
              return (
                <Link
                  className="shop-category-shortcut"
                  href={`/gifts/${catalog.handle}`}
                  key={catalog.id}
                >
                  <Icon size={27} strokeWidth={1.45} />
                  <strong>{catalog.name}</strong>
                  <span>
                    {catalog.description ||
                      (catalog.experience === "build_a_box"
                        ? `Choose ${catalog.boxSize ?? 3} products`
                        : "Explore this gift selection")}
                  </span>
                </Link>
              );
            })}
          </PageContainer>
        </section>
      ) : null}

      <GiftCatalog products={gifts} />
    </div>
  );
}
