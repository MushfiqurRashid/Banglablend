"use client";

import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@bangla-blend/supabase-client";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, UploadCloud } from "lucide-react";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];

export interface ArticleImageValue {
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
  position?: string;
}

export interface ArticleSectionValue {
  id: string;
  eyebrow?: string;
  title: string;
  paragraphs: string[];
  image?: ArticleImageValue;
  pullQuote?: string;
  highlights?: string[];
}

export interface ArticleSourceValue { label: string; url: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readImage(value: unknown): ArticleImageValue {
  if (!isRecord(value)) return { url: "", alt: "" };
  return {
    url: typeof value.url === "string" ? value.url : "",
    alt: typeof value.alt === "string" ? value.alt : "",
    caption: typeof value.caption === "string" ? value.caption : "",
    credit: typeof value.credit === "string" ? value.credit : "",
    position: typeof value.position === "string" ? value.position : "",
  };
}

function readSections(value: unknown): ArticleSectionValue[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.title !== "string") return [];
    const image = isRecord(item.image) ? readImage(item.image) : undefined;
    return [{
      id: typeof item.id === "string" && item.id ? item.id : `section-${index + 1}`,
      eyebrow: typeof item.eyebrow === "string" ? item.eyebrow : "",
      title: item.title,
      paragraphs: Array.isArray(item.paragraphs) ? item.paragraphs.filter((entry): entry is string => typeof entry === "string") : [],
      image: image?.url ? image : undefined,
      pullQuote: typeof item.pullQuote === "string" ? item.pullQuote : "",
      highlights: Array.isArray(item.highlights) ? item.highlights.filter((entry): entry is string => typeof entry === "string") : [],
    }];
  });
}

function readSources(value: unknown): ArticleSourceValue[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => isRecord(item) && typeof item.label === "string" && typeof item.url === "string" ? [{ label: item.label, url: item.url }] : []);
}

function newSection(): ArticleSectionValue {
  return { id: `section-${crypto.randomUUID()}`, eyebrow: "", title: "", paragraphs: [""], highlights: [] };
}

async function uploadImage(file: File) {
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) throw new Error("Choose a PNG, JPEG, WebP or AVIF image.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image must be 10 MB or smaller.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const datePath = new Date().toISOString().slice(0, 10);
  const path = `${datePath}/${crypto.randomUUID()}.${extension}`;
  const supabase = createSupabaseBrowserClient({ cookieName: "banglablend-admin-auth" });
  const { error } = await supabase.storage.from("editorial-images").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from("editorial-images").getPublicUrl(path).data.publicUrl;
}

function ImageEditor({ value, onChange, label, allowDetails = true }: {
  value: ArticleImageValue;
  onChange: (value: ArticleImageValue) => void;
  label: string;
  allowDetails?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewUrl = value.url.startsWith("/images/") ? `/api/editorial-image?src=${encodeURIComponent(value.url)}` : value.url;

  async function acceptFile(file?: File) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      onChange({ ...value, url: await uploadImage(file) });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="article-image-editor">
      <div
        className={`article-image-dropzone${value.url ? " has-image" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); void acceptFile(event.dataTransfer.files?.[0]); }}
      >
        {value.url ? <div className="article-image-preview" role="img" aria-label={value.alt || `${label} preview`} style={{ backgroundImage: `url(${JSON.stringify(previewUrl)})` }} /> : <ImagePlus aria-hidden="true" />}
        <div>
          <strong>{uploading ? "Uploading…" : value.url ? `Replace ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}</strong>
          <span>Drop an image here or choose a file · PNG, JPG, WebP or AVIF · max 10 MB</span>
        </div>
        <button className="btn btn-secondary" type="button" disabled={uploading} onClick={() => inputRef.current?.click()}><UploadCloud aria-hidden="true" /> Choose image</button>
        <input ref={inputRef} className="sr-only" type="file" accept={ALLOWED_UPLOAD_TYPES.join(",")} onChange={(event) => { void acceptFile(event.target.files?.[0]); event.target.value = ""; }} />
      </div>
      {error ? <p className="error-text" role="alert">{error}</p> : null}
      <div className="article-image-fields">
        <label className="field"><span className="label">Image URL</span><input className="input" value={value.url} onChange={(event) => onChange({ ...value, url: event.target.value })} placeholder="https://… or /images/…" /></label>
        <label className="field"><span className="label">Alternative text</span><input className="input" value={value.alt} onChange={(event) => onChange({ ...value, alt: event.target.value })} placeholder="Describe what the image shows" /></label>
        {allowDetails ? <>
          <label className="field"><span className="label">Caption</span><input className="input" value={value.caption ?? ""} onChange={(event) => onChange({ ...value, caption: event.target.value })} /></label>
          <label className="field"><span className="label">Credit</span><input className="input" value={value.credit ?? ""} onChange={(event) => onChange({ ...value, credit: event.target.value })} /></label>
          <label className="field"><span className="label">Focal position</span><select className="select" value={value.position ?? ""} onChange={(event) => onChange({ ...value, position: event.target.value })}><option value="">Centre</option><option value="center top">Top</option><option value="center bottom">Bottom</option><option value="left center">Left</option><option value="right center">Right</option></select></label>
        </> : null}
      </div>
    </div>
  );
}

export function ArticleHeroImageField({ initial }: { initial: unknown }) {
  const [image, setImage] = useState(() => readImage(initial));
  return (
    <section className="article-editor-panel">
      <input type="hidden" name="hero_image" value={image.url ? JSON.stringify({ url: image.url, alt: image.alt }) : ""} />
      <div className="article-editor-panel-heading"><div><h2>Hero image</h2><p>The lead image used on article cards, social previews and the story header.</p></div></div>
      <ImageEditor label="Hero image" value={image} onChange={setImage} allowDetails={false} />
    </section>
  );
}

export function ArticleSectionsField({ initial }: { initial: unknown }) {
  const [sections, setSections] = useState(() => readSections(initial));
  const update = (index: number, changes: Partial<ArticleSectionValue>) => setSections((current) => current.map((section, itemIndex) => itemIndex === index ? { ...section, ...changes } : section));
  const move = (index: number, direction: -1 | 1) => setSections((current) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= current.length) return current;
    const next = [...current];
    const section = next[index]!;
    next[index] = next[nextIndex]!;
    next[nextIndex] = section;
    return next;
  });

  return (
    <section className="article-editor-panel">
      <input type="hidden" name="story_sections" value={JSON.stringify(sections.map((section) => ({ ...section, image: section.image?.url ? section.image : undefined, paragraphs: section.paragraphs.filter(Boolean), highlights: section.highlights?.filter(Boolean) })))} />
      <div className="article-editor-panel-heading"><div><h2>Story chapters</h2><p>Add, remove and reorder the sections that form the public article.</p></div><button className="btn btn-secondary" type="button" onClick={() => setSections((current) => [...current, newSection()])}><Plus aria-hidden="true" /> Add chapter</button></div>
      {sections.length ? <div className="article-section-list">{sections.map((section, index) => (
        <article className="article-section-card" key={section.id}>
          <div className="article-section-card-heading">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{section.title || "Untitled chapter"}</strong>
            <div>
              <button className="icon-button" type="button" aria-label="Move chapter up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp /></button>
              <button className="icon-button" type="button" aria-label="Move chapter down" disabled={index === sections.length - 1} onClick={() => move(index, 1)}><ArrowDown /></button>
              <button className="icon-button danger" type="button" aria-label="Delete chapter" onClick={() => setSections((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></button>
            </div>
          </div>
          <div className="article-section-fields">
            <label className="field"><span className="label">Kicker / place</span><input className="input" value={section.eyebrow ?? ""} onChange={(event) => update(index, { eyebrow: event.target.value })} placeholder="For example: Chattogram" /></label>
            <label className="field"><span className="label">Chapter title</span><input className="input" required value={section.title} onChange={(event) => update(index, { title: event.target.value, id: section.id.startsWith("section-") ? section.id : section.id })} /></label>
            <label className="field article-section-full"><span className="label">Paragraphs</span><textarea className="textarea article-copy-textarea" value={section.paragraphs.join("\n\n")} onChange={(event) => update(index, { paragraphs: event.target.value.split(/\n\s*\n/).map((paragraph) => paragraph.trim()) })} placeholder="Leave a blank line between paragraphs." /></label>
            <label className="field article-section-full"><span className="label">Pull quote (optional)</span><textarea className="textarea" rows={2} value={section.pullQuote ?? ""} onChange={(event) => update(index, { pullQuote: event.target.value })} /></label>
            <label className="field article-section-full"><span className="label">Highlights (one per line)</span><textarea className="textarea" rows={3} value={(section.highlights ?? []).join("\n")} onChange={(event) => update(index, { highlights: event.target.value.split("\n").map((item) => item.trim()) })} /></label>
          </div>
          {section.image ? <ImageEditor label="Chapter image" value={section.image} onChange={(image) => update(index, { image })} /> : <button className="article-add-image" type="button" onClick={() => update(index, { image: { url: "", alt: "", caption: "", credit: "", position: "" } })}><ImagePlus aria-hidden="true" /> Add an image to this chapter</button>}
          {section.image ? <button className="article-remove-image" type="button" onClick={() => update(index, { image: undefined })}><Trash2 aria-hidden="true" /> Remove chapter image</button> : null}
        </article>
      ))}</div> : <div className="article-editor-empty"><ImagePlus aria-hidden="true" /><p>No chapters yet. Add the first chapter to start building this article.</p><button className="btn btn-primary" type="button" onClick={() => setSections([newSection()])}><Plus aria-hidden="true" /> Add first chapter</button></div>}
    </section>
  );
}

export function ArticleSourcesField({ initial }: { initial: unknown }) {
  const [sources, setSources] = useState(() => readSources(initial));
  return (
    <section className="article-editor-panel">
      <input type="hidden" name="sources" value={JSON.stringify(sources.filter((source) => source.label || source.url))} />
      <div className="article-editor-panel-heading"><div><h2>Further reading</h2><p>Public source links that support the article. Internal evidence belongs in Source notes.</p></div><button className="btn btn-secondary" type="button" onClick={() => setSources((current) => [...current, { label: "", url: "" }])}><Plus aria-hidden="true" /> Add source</button></div>
      <div className="article-source-list">{sources.map((source, index) => <div className="article-source-row" key={index}><input className="input" aria-label={`Source ${index + 1} label`} placeholder="Source label" value={source.label} onChange={(event) => setSources((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /><input className="input" type="url" aria-label={`Source ${index + 1} URL`} placeholder="https://…" value={source.url} onChange={(event) => setSources((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} /><button className="icon-button danger" type="button" aria-label={`Remove source ${index + 1}`} onClick={() => setSources((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></button></div>)}</div>
    </section>
  );
}
