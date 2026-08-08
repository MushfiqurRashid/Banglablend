"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import type { Product } from "@bangla-blend/types";
import { formatMoney } from "@bangla-blend/commerce-client";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductVisual } from "./product-visual";

const PAGE_SIZE = 8;

const collectionLabels: Record<Product["collection"], string> = {
  originals: "Originals",
  reserve: "Reserve",
  pantry: "Pantry",
  "tea-wellness": "Tea & Wellness",
  "lifestyle-accessories": "Lifestyle Accessories",
  gifts: "Gifts",
};

type HeatFilter = "all" | "mild" | "medium" | "hot";
type BestForFilter = "all" | "everyday" | "tea" | "gifting";
type SpiceTypeFilter = "all" | "blends" | "ingredients" | "pantry-tea";

function heatBand(product: Product): Exclude<HeatFilter, "all"> | undefined {
  const heat = product.flavor?.heat;
  if (typeof heat !== "number") return undefined;
  if (heat <= 2) return "mild";
  if (heat === 3) return "medium";
  return "hot";
}

function isBestFor(product: Product, filter: BestForFilter) {
  if (filter === "all") return true;
  if (filter === "tea") return product.collection === "tea-wellness";
  if (filter === "gifting") return product.collection === "gifts";
  return ["originals", "reserve", "pantry"].includes(product.collection);
}

function isSpiceType(product: Product, filter: SpiceTypeFilter) {
  if (filter === "all") return true;
  if (filter === "blends") return product.collection === "originals";
  if (filter === "ingredients") return product.collection === "reserve";
  return ["pantry", "tea-wellness"].includes(product.collection);
}

export function ShopCatalog({ products }: { products: Product[] }) {
  const prices = products.flatMap((product) =>
    product.variants.map((variant) => variant.price.amount),
  );
  const fullPriceRange = Math.max(...prices, 0);
  const currency = products[0]?.variants[0]?.price.currencyCode ?? "BDT";
  const regions = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.region)
            .filter((region): region is string => Boolean(region)),
        ),
      ).sort(),
    [products],
  );
  const availableCollections = useMemo(
    () =>
      (Object.keys(collectionLabels) as Product["collection"][]).filter((collection) =>
        products.some((product) => product.collection === collection),
      ),
    [products],
  );

  const [selectedCollections, setSelectedCollections] = useState<Product["collection"][]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(fullPriceRange);
  const [heat, setHeat] = useState<HeatFilter>("all");
  const [bestFor, setBestFor] = useState<BestForFilter>("all");
  const [spiceType, setSpiceType] = useState<SpiceTypeFilter>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favourites, setFavourites] = useState<string[]>([]);

  const clearFilters = () => {
    setSelectedCollections([]);
    setSelectedRegions([]);
    setMaxPrice(fullPriceRange);
    setHeat("all");
    setBestFor("all");
    setSpiceType("all");
    setInStockOnly(false);
    setPage(1);
  };

  const toggleCollection = (collection: Product["collection"]) => {
    setSelectedCollections((current) =>
      current.includes(collection)
        ? current.filter((item) => item !== collection)
        : [...current, collection],
    );
    setPage(1);
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions((current) =>
      current.includes(region) ? current.filter((item) => item !== region) : [...current, region],
    );
    setPage(1);
  };

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const productPrice = product.variants[0]?.price.amount ?? 0;
      const hasInventory = product.variants.some((variant) => (variant.inventoryQuantity ?? 0) > 0);
      if (selectedCollections.length && !selectedCollections.includes(product.collection))
        return false;
      if (selectedRegions.length && (!product.region || !selectedRegions.includes(product.region)))
        return false;
      if (productPrice > maxPrice) return false;
      if (heat !== "all" && heatBand(product) !== heat) return false;
      if (!isBestFor(product, bestFor)) return false;
      if (!isSpiceType(product, spiceType)) return false;
      if (inStockOnly && !hasInventory) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "price-asc")
        return (a.variants[0]?.price.amount ?? 0) - (b.variants[0]?.price.amount ?? 0);
      if (sort === "price-desc")
        return (b.variants[0]?.price.amount ?? 0) - (a.variants[0]?.price.amount ?? 0);
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "newest") {
        return new Date(b.createdAt ?? 0).valueOf() - new Date(a.createdAt ?? 0).valueOf();
      }
      return Number(Boolean(b.bestSeller)) - Number(Boolean(a.bestSeller));
    });
  }, [
    products,
    selectedCollections,
    selectedRegions,
    maxPrice,
    heat,
    bestFor,
    spiceType,
    inStockOnly,
    sort,
  ]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageProducts = visibleProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = visibleProducts.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, visibleProducts.length);
  const filterCount =
    selectedCollections.length +
    selectedRegions.length +
    Number(maxPrice < fullPriceRange) +
    Number(heat !== "all") +
    Number(bestFor !== "all") +
    Number(spiceType !== "all") +
    Number(inStockOnly);

  return (
    <>
      <section className="shop-catalog-section">
        <div className="shell shop-catalog-layout">
          <button
            type="button"
            className={`shop-filter-backdrop ${filtersOpen ? "is-visible" : ""}`}
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <aside
            className={`shop-filter-panel ${filtersOpen ? "is-open" : ""}`}
            aria-label="Product filters"
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
              <summary>Category</summary>
              <div className="shop-filter-options">
                {availableCollections.map((collection) => {
                  const count = products.filter(
                    (product) => product.collection === collection,
                  ).length;
                  return (
                    <label key={collection}>
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(collection)}
                        onChange={() => toggleCollection(collection)}
                      />
                      <span>{collectionLabels[collection]}</span>
                      <small>{count}</small>
                    </label>
                  );
                })}
              </div>
            </details>

            <details className="shop-filter-group" open>
              <summary>Price</summary>
              <div className="shop-price-filter">
                <input
                  type="range"
                  min={0}
                  max={fullPriceRange || 1}
                  value={maxPrice}
                  aria-label="Maximum price"
                  onChange={(event) => {
                    setMaxPrice(Number(event.target.value));
                    setPage(1);
                  }}
                />
                <div>
                  <span>{formatMoney(0, currency)}</span>
                  <span>{formatMoney(maxPrice, currency)}</span>
                </div>
              </div>
            </details>

            <details className="shop-filter-group">
              <summary>Region</summary>
              <div className="shop-filter-options">
                {regions.map((region) => (
                  <label key={region}>
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(region)}
                      onChange={() => toggleRegion(region)}
                    />
                    <span>{region}</span>
                  </label>
                ))}
              </div>
            </details>

            <details className="shop-filter-group">
              <summary>Dietary</summary>
              <p className="shop-filter-note">
                Dietary options will appear with verified product information.
              </p>
            </details>

            <details className="shop-filter-group">
              <summary>Spice type</summary>
              <div className="shop-filter-options">
                {[
                  ["all", "All types"],
                  ["blends", "Signature blends"],
                  ["ingredients", "Single ingredients"],
                  ["pantry-tea", "Pantry & tea"],
                ].map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="spice-type"
                      checked={spiceType === value}
                      onChange={() => {
                        setSpiceType(value as SpiceTypeFilter);
                        setPage(1);
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </details>

            <details className="shop-filter-group">
              <summary>Heat level</summary>
              <div className="shop-filter-options">
                {[
                  ["all", "All heat levels"],
                  ["mild", "Mild"],
                  ["medium", "Medium"],
                  ["hot", "Hot"],
                ].map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="heat"
                      checked={heat === value}
                      onChange={() => {
                        setHeat(value as HeatFilter);
                        setPage(1);
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </details>

            <details className="shop-filter-group">
              <summary>Best for</summary>
              <div className="shop-filter-options">
                {[
                  ["all", "All occasions"],
                  ["everyday", "Everyday cooking"],
                  ["tea", "Tea rituals"],
                  ["gifting", "Gifting"],
                ].map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="best-for"
                      checked={bestFor === value}
                      onChange={() => {
                        setBestFor(value as BestForFilter);
                        setPage(1);
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </details>

            <details className="shop-filter-group">
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
                  <span>In stock</span>
                </label>
              </div>
            </details>

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
                <p>
                  Showing {rangeStart} to {rangeEnd} of {visibleProducts.length} products
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
                          aria-label={
                            isFavourite
                              ? `Remove ${product.title} from favourites`
                              : `Add ${product.title} to favourites`
                          }
                          aria-pressed={isFavourite}
                          onClick={() =>
                            setFavourites((current) =>
                              current.includes(product.id)
                                ? current.filter((item) => item !== product.id)
                                : [...current, product.id],
                            )
                          }
                        >
                          <Heart size={18} fill={isFavourite ? "currentColor" : "none"} />
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
                        <p>{product.subtitle ?? product.region ?? "Bangladesh"}</p>
                        <div className="shop-product-meta">
                          <span>{product.region ?? "Bangladesh"}</span>
                          <strong>
                            {variant
                              ? formatMoney(variant.price.amount, variant.price.currencyCode)
                              : "Price unavailable"}
                          </strong>
                        </div>
                        <div className="shop-product-actions">
                          {variant ? (
                            <AddToCartButton
                              variantId={variant.id}
                              disabled={
                                Boolean(product.isPlaceholder) ||
                                (variant.inventoryQuantity ?? 0) <= 0
                              }
                            />
                          ) : (
                            <button className="button button-primary" type="button" disabled>
                              Add to cart
                            </button>
                          )}
                          <Link href={`/products/${product.handle}`}>View details</Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="shop-empty-results">
                <Sparkles size={28} />
                <h2>No products match those filters</h2>
                <p>Clear one or more filters to return to the full collection.</p>
                <button type="button" className="button button-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            )}

            {totalPages > 1 ? (
              <nav className="shop-pagination" aria-label="Product pages">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={safePage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                  <button
                    type="button"
                    className={safePage === number ? "is-active" : ""}
                    aria-current={safePage === number ? "page" : undefined}
                    key={number}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <ChevronRight size={18} />
                </button>
              </nav>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
