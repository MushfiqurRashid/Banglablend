"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@bangla-blend/supabase-client";
import { giftTypes, marketCodes, storefrontCollectionHandles } from "@/lib/catalog";
import type { ProductActionState } from "./actions";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];

export interface ProductFormValues {
  title: string;
  handle: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  collection: (typeof storefrontCollectionHandles)[number];
  giftType: (typeof giftTypes)[number] | "";
  region: string;
  ingredients: string;
  storage: string;
  shelfLife: string;
  usageNotes: string;
  eligibleMarkets: string[];
  badges: string;
  bestSeller: boolean;
  storefrontVisible: boolean;
  catalogIds: string[];
  seoTitle: string;
  seoDescription: string;
  seoImageUrl: string;
  variants: Array<{ title: string; sku: string; bdtPrice: string; stockQuantity: string }>;
}

export const emptyProductForm: ProductFormValues = {
  title: "",
  handle: "",
  subtitle: "",
  description: "",
  thumbnailUrl: "",
  thumbnailAlt: "",
  collection: "originals",
  giftType: "",
  region: "",
  ingredients: "",
  storage: "",
  shelfLife: "",
  usageNotes: "",
  eligibleMarkets: ["bd"],
  badges: "",
  bestSeller: false,
  storefrontVisible: false,
  catalogIds: [],
  seoTitle: "",
  seoDescription: "",
  seoImageUrl: "",
  variants: [{ title: "", sku: "", bdtPrice: "", stockQuantity: "0" }],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const TABS = ["details", "category", "tags", "seo", "visibility"] as const;
type Tab = (typeof TABS)[number];

const SHOP_PLACEMENTS = [
  { value: "originals", label: "Originals", path: "/shop/originals" },
  { value: "reserve", label: "Reserve", path: "/shop/reserve" },
  { value: "pantry", label: "Pantry", path: "/shop/pantry" },
  { value: "tea-wellness", label: "Tea & Wellness", path: "/shop/tea-wellness" },
  { value: "lifestyle-accessories", label: "Lifestyle Accessories", path: "/shop/lifestyle-accessories" },
] as const;

const GIFT_PLACEMENTS = [
  { value: "set", label: "Gift Sets", path: "/gifts/gift-sets" },
  { value: "regional", label: "Regional Gifts", path: "/gifts/regional-gifts" },
  { value: "corporate", label: "Corporate Gifting", path: "/gifts/corporate" },
] as const;

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  handle: "Handle",
  subtitle: "Subtitle",
  description: "Description",
  thumbnailUrl: "Thumbnail URL",
  thumbnailAlt: "Thumbnail alt text",
  collection: "Storefront placement",
  giftType: "Gift category",
  region: "Region",
  ingredients: "Ingredients",
  storage: "Storage",
  shelfLife: "Shelf life",
  usageNotes: "Usage notes",
  eligibleMarkets: "Eligible markets",
  badges: "Tags",
  catalogIds: "Storefront catalogs",
  seoTitle: "SEO title",
  seoDescription: "SEO description",
  seoImageUrl: "Social share image URL",
  variants: "Variants",
};

const FIELD_TABS: Partial<Record<string, Tab>> = {
  catalogIds: "category",
  collection: "category",
  giftType: "category",
  badges: "tags",
  bestSeller: "category",
  seoTitle: "seo",
  seoDescription: "seo",
  seoImageUrl: "seo",
  eligibleMarkets: "visibility",
  storefrontVisible: "visibility",
};

const VARIANT_FIELD_LABELS: Record<string, string> = { title: "title", sku: "SKU", bdtPrice: "price", stockQuantity: "stock" };

function labelForFieldKey(key: string): string {
  const [head = "", index, sub] = key.split(".");
  if (head === "variants" && index !== undefined && sub) {
    return `Variant ${Number(index) + 1} ${VARIANT_FIELD_LABELS[sub] ?? sub}`;
  }
  return FIELD_LABELS[head] ?? head;
}

function tabForFieldKey(key: string): Tab {
  const head = key.split(".")[0] ?? "";
  return FIELD_TABS[head] ?? "details";
}

export function ProductForm({
  mode,
  initial,
  catalogs,
  formAction,
  state,
  pending,
  submitLabel,
  readOnly = false,
}: {
  mode: "create" | "edit";
  initial: ProductFormValues;
  catalogs: Array<{ id: string; name: string; section: string }>;
  formAction: (formData: FormData) => void;
  state: ProductActionState | undefined;
  pending: boolean;
  submitLabel: string;
  readOnly?: boolean;
}) {
  const [values, setValues] = useState(initial);
  const [handleTouched, setHandleTouched] = useState(Boolean(initial.handle));
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fieldErrors = state?.fieldErrors ?? {};

  // Jump to whichever tab holds the first invalid field so a failed submit doesn't leave the
  // error sitting on a tab that isn't visible (the summary list below covers the rest).
  useEffect(() => {
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey) setActiveTab(tabForFieldKey(firstKey));
  }, [state]);

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      setUploadError("Please choose a PNG, JPEG, WebP, or AVIF image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("Image must be 10MB or smaller.");
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient({ cookieName: "banglablend-admin-auth" });
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setValues((v) => ({ ...v, thumbnailUrl: data.publicUrl }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const variantsJson = useMemo(() => JSON.stringify(values.variants.map((v) => ({ ...v, bdtPrice: v.bdtPrice, stockQuantity: v.stockQuantity }))), [values.variants]);

  const tabLabels: Record<Tab, string> = {
    details: mode === "create" ? "Add New Product" : "Details",
    category: "Shop & Gift Categories",
    tags: "Tags",
    seo: "SEO",
    visibility: "Visibility",
  };

  return (
    <form action={formAction} className="form-grid" style={{ maxWidth: 760 }}>
      <input type="hidden" name="variantsJson" value={variantsJson} />
      <input type="hidden" name="collection" value={values.collection} />
      <input type="hidden" name="giftType" value={values.giftType} />

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`btn ${activeTab === tab ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <fieldset disabled={readOnly} style={{ display: "contents" }}>
      <div style={{ display: activeTab === "details" ? "flex" : "none", flexDirection: "column", gap: "1rem" }}>
        <section className="card form-grid">
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Basics</h2>
          <div className="field">
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              className="input"
              id="title"
              name="title"
              required
              value={values.title}
              onChange={(e) => {
                const title = e.target.value;
                setValues((v) => ({ ...v, title, handle: handleTouched ? v.handle : slugify(title) }));
              }}
            />
            {fieldErrors.title ? <span className="error-text">{fieldErrors.title}</span> : null}
          </div>
          <div className="field">
            <label className="label" htmlFor="handle">
              Handle (URL slug)
            </label>
            <input
              className="input"
              id="handle"
              name="handle"
              required
              value={values.handle}
              onChange={(e) => {
                setHandleTouched(true);
                setValues((v) => ({ ...v, handle: e.target.value }));
              }}
            />
            {fieldErrors.handle ? <span className="error-text">{fieldErrors.handle}</span> : null}
          </div>
          <div className="field">
            <label className="label" htmlFor="subtitle">
              Subtitle
            </label>
            <input className="input" id="subtitle" name="subtitle" value={values.subtitle} onChange={(e) => setValues((v) => ({ ...v, subtitle: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea className="textarea" id="description" name="description" rows={4} value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
            {fieldErrors.description ? <span className="error-text">{fieldErrors.description}</span> : null}
          </div>
        </section>

        <section className="card form-grid">
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Media</h2>
          <div className="field">
            <label className="label" htmlFor="thumbnailFile">
              Upload image
            </label>
            <input className="input" id="thumbnailFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={handleThumbnailUpload} disabled={uploading} />
            {uploading ? <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>Uploading...</span> : null}
            {uploadError ? <span className="error-text">{uploadError}</span> : null}
          </div>
          {values.thumbnailUrl ? (
            <img
              src={values.thumbnailUrl}
              alt=""
              style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 8, border: "1px solid var(--color-border)" }}
            />
          ) : null}
          <div className="field">
            <label className="label" htmlFor="thumbnailUrl">
              Thumbnail URL
            </label>
            <input className="input" id="thumbnailUrl" name="thumbnailUrl" value={values.thumbnailUrl} onChange={(e) => setValues((v) => ({ ...v, thumbnailUrl: e.target.value }))} />
            {fieldErrors.thumbnailUrl ? <span className="error-text">{fieldErrors.thumbnailUrl}</span> : null}
          </div>
          <div className="field">
            <label className="label" htmlFor="thumbnailAlt">
              Thumbnail alt text
            </label>
            <input className="input" id="thumbnailAlt" name="thumbnailAlt" value={values.thumbnailAlt} onChange={(e) => setValues((v) => ({ ...v, thumbnailAlt: e.target.value }))} />
          </div>
        </section>

        <section className="card form-grid">
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Details</h2>
          <div className="field">
            <label className="label" htmlFor="region">
              Region
            </label>
            <input className="input" id="region" name="region" value={values.region} onChange={(e) => setValues((v) => ({ ...v, region: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label" htmlFor="ingredients">
              Ingredients
            </label>
            <textarea className="textarea" id="ingredients" name="ingredients" rows={2} value={values.ingredients} onChange={(e) => setValues((v) => ({ ...v, ingredients: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label" htmlFor="storage">
              Storage
            </label>
            <input className="input" id="storage" name="storage" value={values.storage} onChange={(e) => setValues((v) => ({ ...v, storage: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label" htmlFor="shelfLife">
              Shelf life
            </label>
            <input className="input" id="shelfLife" name="shelfLife" value={values.shelfLife} onChange={(e) => setValues((v) => ({ ...v, shelfLife: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label" htmlFor="usageNotes">
              Usage notes
            </label>
            <textarea className="textarea" id="usageNotes" name="usageNotes" rows={2} value={values.usageNotes} onChange={(e) => setValues((v) => ({ ...v, usageNotes: e.target.value }))} />
          </div>
        </section>

        <section className="card form-grid">
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Variants</h2>
          <p style={{ color: "var(--color-muted)", fontSize: "0.8rem", marginTop: "-0.5rem" }}>
            Every variant needs a title, a unique SKU (letters/numbers, may include . _ -), a price above 0, and a stock count.
            A stock value of 0 keeps the product visible but disables Add to cart for that variant.
          </p>
          {fieldErrors.variants ? <span className="error-text">{fieldErrors.variants}</span> : null}
          {values.variants.map((variant, index) => (
            <div key={index} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto", gap: "0.5rem", alignItems: "start" }}>
              <div className="field">
                <label className="label">Title</label>
                <input
                  className="input"
                  value={variant.title}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, variants: v.variants.map((item, i) => (i === index ? { ...item, title: e.target.value } : item)) }))
                  }
                  required
                />
                {fieldErrors[`variants.${index}.title`] ? <span className="error-text">{fieldErrors[`variants.${index}.title`]}</span> : null}
              </div>
              <div className="field">
                <label className="label">SKU</label>
                <input
                  className="input"
                  value={variant.sku}
                  onChange={(e) => setValues((v) => ({ ...v, variants: v.variants.map((item, i) => (i === index ? { ...item, sku: e.target.value } : item)) }))}
                  required
                />
                {fieldErrors[`variants.${index}.sku`] ? <span className="error-text">{fieldErrors[`variants.${index}.sku`]}</span> : null}
              </div>
              <div className="field">
                <label className="label">Price (BDT)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.bdtPrice}
                  onChange={(e) => setValues((v) => ({ ...v, variants: v.variants.map((item, i) => (i === index ? { ...item, bdtPrice: e.target.value } : item)) }))}
                  required
                />
                {fieldErrors[`variants.${index}.bdtPrice`] ? <span className="error-text">{fieldErrors[`variants.${index}.bdtPrice`]}</span> : null}
              </div>
              <div className="field">
                <label className="label">Stock</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={variant.stockQuantity}
                  onChange={(e) => setValues((v) => ({ ...v, variants: v.variants.map((item, i) => (i === index ? { ...item, stockQuantity: e.target.value } : item)) }))}
                  required
                />
                {fieldErrors[`variants.${index}.stockQuantity`] ? <span className="error-text">{fieldErrors[`variants.${index}.stockQuantity`]}</span> : null}
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={values.variants.length <= 1}
                onClick={() => setValues((v) => ({ ...v, variants: v.variants.filter((_, i) => i !== index) }))}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary"
            style={{ alignSelf: "start" }}
            onClick={() => setValues((v) => ({ ...v, variants: [...v.variants, { title: "", sku: "", bdtPrice: "", stockQuantity: "0" }] }))}
          >
            Add variant
          </button>
        </section>
      </div>

      <section className="card form-grid" style={{ display: activeTab === "category" ? "grid" : "none" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Shop &amp; Gift Categories</h2>
        <p style={{ color: "var(--color-muted)", fontSize: "0.8rem", marginTop: "-0.5rem" }}>
          Choose one main storefront destination. Shop products appear in Shop All automatically; newly created products also appear in New Arrivals.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          <div style={{ border: "1px solid var(--color-border)", borderRadius: 10, padding: "1rem", display: "grid", gap: "0.75rem" }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Shop product</h3>
              <p style={{ color: "var(--color-muted)", fontSize: "0.75rem", margin: "0.2rem 0 0" }}>Choose its primary Shop category.</p>
            </div>
            {SHOP_PLACEMENTS.map((placement) => (
              <label key={placement.value} style={{ display: "flex", alignItems: "start", gap: "0.5rem", fontSize: "0.875rem" }}>
                <input
                  type="radio"
                  name="storefrontPlacement"
                  value={placement.value}
                  checked={values.collection === placement.value}
                  onChange={() => setValues((v) => ({ ...v, collection: placement.value, giftType: "" }))}
                />
                <span>
                  <strong>{placement.label}</strong>
                  <br />
                  <code style={{ color: "var(--color-muted)", fontSize: "0.72rem" }}>{placement.path}</code>
                </span>
              </label>
            ))}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem", display: "grid", gap: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                <input type="checkbox" name="bestSeller" checked={values.bestSeller} onChange={(e) => setValues((v) => ({ ...v, bestSeller: e.target.checked }))} />
                Also show in Best Sellers
              </label>
              <span style={{ color: "var(--color-muted)", fontSize: "0.72rem" }}>/shop/best-sellers</span>
              <p style={{ color: "var(--color-muted)", fontSize: "0.75rem", margin: 0 }}>Shop All and New Arrivals are automatic.</p>
            </div>
          </div>

          <div style={{ border: "1px solid var(--color-border)", borderRadius: 10, padding: "1rem", display: "grid", gap: "0.75rem" }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Gift product</h3>
              <p style={{ color: "var(--color-muted)", fontSize: "0.75rem", margin: "0.2rem 0 0" }}>Choose the Gift section where this product belongs.</p>
            </div>
            {GIFT_PLACEMENTS.map((placement) => (
              <label key={placement.value} style={{ display: "flex", alignItems: "start", gap: "0.5rem", fontSize: "0.875rem" }}>
                <input
                  type="radio"
                  name="storefrontPlacement"
                  value={`gift:${placement.value}`}
                  checked={values.collection === "gifts" && values.giftType === placement.value}
                  onChange={() => setValues((v) => ({ ...v, collection: "gifts", giftType: placement.value }))}
                />
                <span>
                  <strong>{placement.label}</strong>
                  <br />
                  <code style={{ color: "var(--color-muted)", fontSize: "0.72rem" }}>{placement.path}</code>
                </span>
              </label>
            ))}
          </div>
        </div>
        {fieldErrors.collection ? <span className="error-text">{fieldErrors.collection}</span> : null}
        {fieldErrors.giftType ? <span className="error-text">{fieldErrors.giftType}</span> : null}

        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginBottom: "0.65rem" }}>
            <div>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>Custom categories</h3>
              <p style={{ color: "var(--color-muted)", fontSize: "0.75rem", margin: "0.2rem 0 0" }}>Assign this product to any additional category created under Shop or Gifts.</p>
            </div>
            <Link href="/catalogs" className="btn btn-secondary">Manage categories</Link>
          </div>
          {catalogs.length ? (
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {catalogs.map((catalog) => (
                <label key={catalog.id} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.875rem" }}>
                  <input
                    type="checkbox"
                    name="catalogIds"
                    value={catalog.id}
                    checked={values.catalogIds.includes(catalog.id)}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        catalogIds: e.target.checked ? [...v.catalogIds, catalog.id] : v.catalogIds.filter((id) => id !== catalog.id),
                      }))
                    }
                  />
                  {catalog.name} ({catalog.section})
                </label>
              ))}
            </div>
          ) : (
            <p className="empty-state">No custom categories yet. Use Manage categories to create one.</p>
          )}
        </div>
      </section>

      <section className="card form-grid" style={{ display: activeTab === "tags" ? "grid" : "none" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Tags</h2>
        <div className="field">
          <label className="label" htmlFor="badges">
            Tags (comma separated)
          </label>
          <input className="input" id="badges" name="badges" value={values.badges} onChange={(e) => setValues((v) => ({ ...v, badges: e.target.value }))} placeholder="Bestseller, Aromatic blend" />
        </div>
      </section>

      <section className="card form-grid" style={{ display: activeTab === "seo" ? "grid" : "none" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>SEO</h2>
        <div className="field">
          <label className="label" htmlFor="seoTitle">
            SEO title
          </label>
          <input className="input" id="seoTitle" name="seoTitle" value={values.seoTitle} onChange={(e) => setValues((v) => ({ ...v, seoTitle: e.target.value }))} maxLength={160} />
        </div>
        <div className="field">
          <label className="label" htmlFor="seoDescription">
            SEO description
          </label>
          <textarea
            className="textarea"
            id="seoDescription"
            name="seoDescription"
            rows={3}
            maxLength={320}
            value={values.seoDescription}
            onChange={(e) => setValues((v) => ({ ...v, seoDescription: e.target.value }))}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="seoImageUrl">
            Social share image URL
          </label>
          <input className="input" id="seoImageUrl" name="seoImageUrl" value={values.seoImageUrl} onChange={(e) => setValues((v) => ({ ...v, seoImageUrl: e.target.value }))} />
        </div>
      </section>

      <section className="card form-grid" style={{ display: activeTab === "visibility" ? "grid" : "none" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Visibility</h2>
        <div className="field">
          <span className="label">Eligible markets</span>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {marketCodes.map((market) => (
              <label key={market} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.875rem" }}>
                <input
                  type="checkbox"
                  name="eligibleMarkets"
                  value={market}
                  checked={values.eligibleMarkets.includes(market)}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      eligibleMarkets: e.target.checked ? [...v.eligibleMarkets, market] : v.eligibleMarkets.filter((m) => m !== market),
                    }))
                  }
                />
                {market.toUpperCase()}
              </label>
            ))}
          </div>
          {fieldErrors.eligibleMarkets ? <span className="error-text">{fieldErrors.eligibleMarkets}</span> : null}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
          <input type="checkbox" name="storefrontVisible" checked={values.storefrontVisible} onChange={(e) => setValues((v) => ({ ...v, storefrontVisible: e.target.checked }))} />
          Publish to storefront (requires description and thumbnail)
        </label>
        {mode === "edit" ? (
          <p style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>Full publish readiness is shown above this form.</p>
        ) : null}
      </section>
      </fieldset>

      {state?.error ? <p className="error-text">{state.error}</p> : null}
      {Object.keys(fieldErrors).length > 0 ? (
        <ul className="error-text" style={{ margin: 0, paddingLeft: "1.1rem" }}>
          {Object.entries(fieldErrors).map(([key, message]) => (
            <li key={key}>
              {labelForFieldKey(key)}: {message}
            </li>
          ))}
        </ul>
      ) : null}
      {!readOnly ? (
        <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: "start" }}>
          {pending ? "Saving..." : submitLabel}
        </button>
      ) : null}
    </form>
  );
}
