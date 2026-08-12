"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@bangla-blend/supabase-client";
import type { CatalogActionState } from "./actions";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];

const sections = [
  { value: "originals", label: "Shop / Originals" },
  { value: "reserve", label: "Shop / Reserve" },
  { value: "pantry", label: "Shop / Pantry" },
  { value: "tea-wellness", label: "Shop / Tea & Wellness" },
  { value: "lifestyle-accessories", label: "Shop / Lifestyle Accessories" },
  { value: "gifts", label: "Gifts" },
] as const;

export interface CatalogFormValues {
  name: string;
  handle: string;
  description: string;
  navigationImageUrl: string;
  navigationImageAlt: string;
  heroImageUrl: string;
  heroImageAlt: string;
  section: (typeof sections)[number]["value"];
  experience: "listing" | "build_a_box";
  boxSize: string;
  isActive: boolean;
}

export const emptyCatalogForm: CatalogFormValues = {
  name: "",
  handle: "",
  description: "",
  navigationImageUrl: "",
  navigationImageAlt: "",
  heroImageUrl: "",
  heroImageAlt: "",
  section: "gifts",
  experience: "listing",
  boxSize: "3",
  isActive: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CatalogForm({
  initial,
  formAction,
  state,
  pending,
  submitLabel,
  readOnly = false,
}: {
  initial: CatalogFormValues;
  formAction: (formData: FormData) => void;
  state: CatalogActionState | undefined;
  pending: boolean;
  submitLabel: string;
  readOnly?: boolean;
}) {
  const [values, setValues] = useState(initial);
  const [handleTouched, setHandleTouched] = useState(Boolean(initial.handle));
  const [uploading, setUploading] = useState<"navigation" | "hero" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const categoryPath = values.section === "gifts" ? `/gifts/${values.handle || "category-handle"}` : `/shop/${values.section}/${values.handle || "category-handle"}`;

  async function uploadImage(kind: "navigation" | "hero", event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
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
    setUploading(kind);
    try {
      const supabase = createSupabaseBrowserClient({ cookieName: "banglablend-admin-auth" });
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${kind}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("catalog-images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("catalog-images").getPublicUrl(path);
      setValues((current) =>
        kind === "navigation"
          ? { ...current, navigationImageUrl: data.publicUrl }
          : { ...current, heroImageUrl: data.publicUrl },
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <form action={formAction} className="form-grid card" style={{ maxWidth: 520 }}>
      <fieldset disabled={readOnly} style={{ display: "contents" }}>
      <div className="field">
        <label className="label" htmlFor="name">
          Category name
        </label>
        <input
          className="input"
          id="name"
          name="name"
          required
          value={values.name}
          onChange={(e) => {
            const name = e.target.value;
            setValues((v) => ({ ...v, name, handle: handleTouched ? v.handle : slugify(name) }));
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="handle">
          URL handle
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
      </div>
      <p style={{ color: "var(--color-muted)", fontSize: "0.75rem", margin: "-0.4rem 0 0" }}>
        Storefront URL: <code>{categoryPath}</code>
      </p>
      <div className="field">
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea className="textarea" id="description" name="description" rows={2} value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
      </div>
      <section className="form-grid" style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--color-border)" }}>
        <div>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Navigation image</h2>
          <p style={{ color: "var(--color-muted)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
            A compact image shown in full beside this category in the desktop navigation.
          </p>
        </div>
        <div className="field">
          <label className="label" htmlFor="navigationImageFile">Upload navigation image</label>
          <input
            className="input"
            id="navigationImageFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            disabled={Boolean(uploading)}
            onChange={(event) => void uploadImage("navigation", event)}
          />
        </div>
        {values.navigationImageUrl ? (
          <img src={values.navigationImageUrl} alt="" style={{ width: 144, height: 104, objectFit: "contain", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-parchment)" }} />
        ) : null}
        <div className="field">
          <label className="label" htmlFor="navigationImageUrl">Navigation image URL</label>
          <input className="input" id="navigationImageUrl" name="navigationImageUrl" value={values.navigationImageUrl} onChange={(e) => setValues((v) => ({ ...v, navigationImageUrl: e.target.value }))} />
        </div>
        <div className="field">
          <label className="label" htmlFor="navigationImageAlt">Navigation image alt text</label>
          <input className="input" id="navigationImageAlt" name="navigationImageAlt" value={values.navigationImageAlt} onChange={(e) => setValues((v) => ({ ...v, navigationImageAlt: e.target.value }))} />
        </div>
      </section>
      <section className="form-grid" style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--color-border)" }}>
        <div>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Page header image</h2>
          <p style={{ color: "var(--color-muted)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
            A wide image shown in the header of this category&apos;s storefront page.
          </p>
        </div>
        <div className="field">
          <label className="label" htmlFor="heroImageFile">Upload page header image</label>
          <input
            className="input"
            id="heroImageFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            disabled={Boolean(uploading)}
            onChange={(event) => void uploadImage("hero", event)}
          />
        </div>
        {values.heroImageUrl ? (
          <img src={values.heroImageUrl} alt="" style={{ width: "100%", maxWidth: 360, aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 8, border: "1px solid var(--color-border)" }} />
        ) : null}
        <div className="field">
          <label className="label" htmlFor="heroImageUrl">Page header image URL</label>
          <input className="input" id="heroImageUrl" name="heroImageUrl" value={values.heroImageUrl} onChange={(e) => setValues((v) => ({ ...v, heroImageUrl: e.target.value }))} />
        </div>
        <div className="field">
          <label className="label" htmlFor="heroImageAlt">Page header image alt text</label>
          <input className="input" id="heroImageAlt" name="heroImageAlt" value={values.heroImageAlt} onChange={(e) => setValues((v) => ({ ...v, heroImageAlt: e.target.value }))} />
        </div>
      </section>
      {uploading ? <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>Uploading {uploading} image...</span> : null}
      {uploadError ? <span className="error-text">{uploadError}</span> : null}
      <div className="field">
        <label className="label" htmlFor="section">
          Parent section
        </label>
        <select className="select" id="section" name="section" value={values.section} onChange={(e) => setValues((v) => ({ ...v, section: e.target.value as CatalogFormValues["section"] }))}>
          {sections.map((section) => (
            <option key={section.value} value={section.value}>
              {section.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="label" htmlFor="experience">
          Category page type
        </label>
        <select className="select" id="experience" name="experience" value={values.experience} onChange={(e) => setValues((v) => ({ ...v, experience: e.target.value as CatalogFormValues["experience"] }))}>
          <option value="listing">Standard product listing</option>
          <option value="build_a_box">Build a Box</option>
        </select>
      </div>
      {values.experience === "build_a_box" ? (
        <div className="field">
          <label className="label" htmlFor="boxSize">
            Box size
          </label>
          <input className="input" id="boxSize" name="boxSize" type="number" min={2} max={12} value={values.boxSize} onChange={(e) => setValues((v) => ({ ...v, boxSize: e.target.value }))} />
        </div>
      ) : null}
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
        <input type="checkbox" name="isActive" checked={values.isActive} onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))} />
        Active (show in storefront navigation)
      </label>
      {state?.error ? <p className="error-text">{state.error}</p> : null}
      </fieldset>
      {!readOnly ? (
        <button className="btn btn-primary" type="submit" disabled={pending} style={{ alignSelf: "start" }}>
          {pending ? "Saving..." : submitLabel}
        </button>
      ) : null}
    </form>
  );
}
