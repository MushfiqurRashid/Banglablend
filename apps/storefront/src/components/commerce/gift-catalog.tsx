"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Gift,
  Heart,
  LayoutGrid,
  List,
  MapPin,
  PackageOpen,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import type { Product } from "@bangla-blend/types";
import { formatMoney } from "@bangla-blend/commerce-client";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductVisual } from "./product-visual";

const PAGE_SIZE = 8;

type GiftTypeFilter = "all" | "set" | "regional";
type PriceFilter = "all" | "under-1000" | "1000-2000" | "over-2000";

function matchesPrice(amount: number, filter: PriceFilter) {
  if (filter === "under-1000") return amount < 1000;
  if (filter === "1000-2000") return amount >= 1000 && amount <= 2000;
  if (filter === "over-2000") return amount > 2000;
  return true;
}

export function GiftCatalog({ products }: { products: Product[] }) {
  const [giftType, setGiftType] = useState<GiftTypeFilter>("all");
  const [priceBand, setPriceBand] = useState<PriceFilter>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favourites, setFavourites] = useState<string[]>([]);

  const clearFilters = () => {
    setGiftType("all");
    setPriceBand("all");
    setInStockOnly(false);
    setPage(1);
  };

  const chooseShortcut = (nextPrice: PriceFilter, nextType: GiftTypeFilter = "all") => {
    setPriceBand(nextPrice);
    setGiftType(nextType);
    setPage(1);
    document.getElementById("gift-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const amount = product.variants[0]?.price.amount ?? 0;
      const hasInventory = product.variants.some((variant) => (variant.inventoryQuantity ?? 0) > 0);
      if (giftType !== "all" && product.giftType !== giftType) return false;
      if (!matchesPrice(amount, priceBand)) return false;
      if (inStockOnly && !hasInventory) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "price-asc")
        return (a.variants[0]?.price.amount ?? 0) - (b.variants[0]?.price.amount ?? 0);
      if (sort === "price-desc")
        return (b.variants[0]?.price.amount ?? 0) - (a.variants[0]?.price.amount ?? 0);
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "newest")
        return new Date(b.createdAt ?? 0).valueOf() - new Date(a.createdAt ?? 0).valueOf();
      return Number(Boolean(b.bestSeller)) - Number(Boolean(a.bestSeller));
    });
  }, [giftType, inStockOnly, priceBand, products, sort]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageProducts = visibleProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = visibleProducts.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, visibleProducts.length);
  const filterCount =
    Number(giftType !== "all") + Number(priceBand !== "all") + Number(inStockOnly);

  const giftTypeCount = (type: Exclude<GiftTypeFilter, "all">) =>
    products.filter((product) => product.giftType === type).length;

  return (
    <>
      <section
        className="shop-category-band gift-category-band"
        aria-label="Shop gifts by price and style"
      >
        <div className="shell shop-category-shortcuts gift-category-shortcuts">
          <button
            type="button"
            className={`shop-category-shortcut ${priceBand === "all" && giftType === "all" ? "is-active" : ""}`}
            onClick={() => chooseShortcut("all")}
          >
            <Gift size={27} strokeWidth={1.45} />
            <strong>All gifts</strong>
            <span>See every set ready for gifting</span>
          </button>
          <button
            type="button"
            className={`shop-category-shortcut ${priceBand === "under-1000" ? "is-active" : ""}`}
            onClick={() => chooseShortcut("under-1000")}
          >
            <WalletCards size={27} strokeWidth={1.45} />
            <strong>Under ৳1,000</strong>
            <span>Small gestures, big flavour</span>
          </button>
          <button
            type="button"
            className={`shop-category-shortcut ${priceBand === "1000-2000" ? "is-active" : ""}`}
            onClick={() => chooseShortcut("1000-2000")}
          >
            <PackageOpen size={27} strokeWidth={1.45} />
            <strong>৳1,000 to ৳2,000</strong>
            <span>Generous sets for any occasion</span>
          </button>
          <button
            type="button"
            className={`shop-category-shortcut ${giftType === "regional" ? "is-active" : ""}`}
            onClick={() => chooseShortcut("all", "regional")}
          >
            <MapPin size={27} strokeWidth={1.45} />
            <strong>Regional gifts</strong>
            <span>Flavours connected to place</span>
          </button>
          <button
            type="button"
            className={`shop-category-shortcut ${priceBand === "over-2000" ? "is-active" : ""}`}
            onClick={() => chooseShortcut("over-2000")}
          >
            <Sparkles size={27} strokeWidth={1.45} />
            <strong>Premium boxes</strong>
            <span>For milestones and feasts</span>
          </button>
          <Link className="shop-category-shortcut" href="/gifts/corporate">
            <Building2 size={27} strokeWidth={1.45} />
            <strong>Corporate gifts</strong>
            <span>Thoughtful gifting at scale</span>
          </Link>
        </div>
      </section>

      <section className="shop-catalog-section" id="gift-catalog">
        <div className="shell shop-catalog-layout">
          <button
            type="button"
            className={`shop-filter-backdrop ${filtersOpen ? "is-visible" : ""}`}
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />

          <aside
            className={`shop-filter-panel ${filtersOpen ? "is-open" : ""}`}
            aria-label="Gift filters"
          >
            <div className="shop-filter-heading">
              <div>
                <span>Filters</span>
                {filterCount ? <small>{filterCount} active</small> : null}
              </div>
              <button
                type="button"
                className="shop-clear-link"
                onClick={clearFilters}
                disabled={!filterCount}
              >
                Clear all
              </button>
              <button
                type="button"
                className="shop-filter-close"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
              >
                <X size={19} />
              </button>
            </div>

            <details className="shop-filter-group" open>
              <summary>Gift style</summary>
              <div className="shop-filter-options">
                {[
                  ["all", "All gifts", products.length],
                  ["set", "Gift sets", giftTypeCount("set")],
                  ["regional", "Regional gifts", giftTypeCount("regional")],
                ].map(([value, label, count]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="gift-type"
                      checked={giftType === value}
                      onChange={() => {
                        setGiftType(value as GiftTypeFilter);
                        setPage(1);
                      }}
                    />
                    <span>{label}</span>
                    <small>{count}</small>
                  </label>
                ))}
              </div>
            </details>

            <details className="shop-filter-group" open>
              <summary>Price</summary>
              <div className="shop-filter-options">
                {[
                  ["all", "All prices"],
                  ["under-1000", "Under ৳1,000"],
                  ["1000-2000", "৳1,000 to ৳2,000"],
                  ["over-2000", "Over ৳2,000"],
                ].map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="gift-price"
                      checked={priceBand === value}
                      onChange={() => {
                        setPriceBand(value as PriceFilter);
                        setPage(1);
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </details>

            <details className="shop-filter-group" open>
              <summary>Availability</summary>
              <div className="shop-filter-options">
                <label>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(event) => {
                      setInStockOnly(event.target.checked);
                      setPage(1);
                    }}
                  />
                  <span>Ready to send</span>
                </label>
              </div>
            </details>

            <div className="gift-filter-note">
              <Gift size={18} />
              <p>
                Every box can include a personal note. Product prices stay off the packing slip.
              </p>
            </div>

            <button
              type="button"
              className="button button-secondary shop-clear-button"
              onClick={clearFilters}
            >
              Clear all filters
            </button>
          </aside>

          <div className="shop-results">
            <div className="shop-results-toolbar">
              <div className="shop-results-summary">
                <button
                  type="button"
                  className="shop-mobile-filter"
                  onClick={() => setFiltersOpen(true)}
                >
                  <SlidersHorizontal size={17} />
                  Filters
                  {filterCount ? <span>{filterCount}</span> : null}
                </button>
                <p aria-live="polite">
                  Showing {rangeStart} to {rangeEnd} of {visibleProducts.length} gifts
                </p>
              </div>
              <div className="shop-results-controls">
                <label>
                  <span>Sort by</span>
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                    <option value="name">Name</option>
                  </select>
                </label>
                <div className="shop-view-toggle" aria-label="Product view">
                  <button
                    type="button"
                    className={view === "grid" ? "is-active" : ""}
                    aria-label="Grid view"
                    aria-pressed={view === "grid"}
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    type="button"
                    className={view === "list" ? "is-active" : ""}
                    aria-label="List view"
                    aria-pressed={view === "list"}
                    onClick={() => setView("list")}
                  >
                    <List size={19} />
                  </button>
                </div>
              </div>
            </div>

            {pageProducts.length ? (
              <div className={`shop-product-grid ${view === "list" ? "is-list" : ""}`}>
                {pageProducts.map((product) => {
                  const variant = product.variants[0];
                  const isFavourite = favourites.includes(product.id);

                  return (
                    <article className="shop-product-card" key={product.id}>
                      <div className="shop-product-placeholder">
                        <Link
                          className="shop-product-media-link"
                          href={`/products/${product.handle}`}
                          aria-label={`View ${product.title}`}
                        >
                          <ProductVisual product={product} />
                        </Link>
                        <button
                          type="button"
                          className={isFavourite ? "is-active" : ""}
                          aria-label={`${isFavourite ? "Remove" : "Add"} ${product.title} ${isFavourite ? "from" : "to"} favourites`}
                          aria-pressed={isFavourite}
                          onClick={() =>
                            setFavourites((current) =>
                              current.includes(product.id)
                                ? current.filter((item) => item !== product.id)
                                : [...current, product.id],
                            )
                          }
                        >
                          <Heart size={17} fill={isFavourite ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <div className="shop-product-copy">
                        <div className="shop-product-badges">
                          {product.badges.slice(0, 2).map((badge) => (
                            <span key={badge}>{badge}</span>
                          ))}
                        </div>
                        <Link href={`/products/${product.handle}`}>
                          <h2>{product.title}</h2>
                        </Link>
                        <p>{product.subtitle}</p>
                        <div className="shop-product-meta">
                          <span>{variant?.title ?? product.region}</span>
                          <strong>
                            {variant
                              ? formatMoney(variant.price.amount, variant.price.currencyCode)
                              : "Coming soon"}
                          </strong>
                        </div>
                        {variant ? (
                          <div className="shop-product-actions">
                            <AddToCartButton variantId={variant.id} label="Add gift to bag" />
                            <Link href={`/products/${product.handle}`}>
                              View what&apos;s inside
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="shop-empty-results">
                <Gift size={34} strokeWidth={1.4} />
                <h2>No gifts match those filters</h2>
                <p>Try another price range or return to the complete gift collection.</p>
                <button type="button" className="button button-secondary" onClick={clearFilters}>
                  View all gifts
                </button>
              </div>
            )}

            {totalPages > 1 ? (
              <nav className="shop-pagination" aria-label="Gift pages">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={safePage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={17} />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    type="button"
                    className={safePage === pageNumber ? "is-active" : ""}
                    aria-label={`Page ${pageNumber}`}
                    aria-current={safePage === pageNumber ? "page" : undefined}
                    onClick={() => setPage(pageNumber)}
                    key={pageNumber}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <ChevronRight size={17} />
                </button>
              </nav>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
