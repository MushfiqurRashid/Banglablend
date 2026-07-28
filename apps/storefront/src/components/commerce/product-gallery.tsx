"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import type { ProductMedia } from "@/lib/product-presentation";

interface GalleryView extends ProductMedia {
  id: string;
  position: string;
  scale: number;
}

const cropViews = [
  { position: "50% 50%", scale: 1 },
  { position: "28% 45%", scale: 1.55 },
  { position: "74% 55%", scale: 1.6 },
  { position: "50% 24%", scale: 1.45 },
  { position: "50% 80%", scale: 1.5 }
];

function buildViews(media: ProductMedia[]): GalleryView[] {
  if (media.length > 1) {
    return media.slice(0, 5).map((item, index) => ({
      ...item,
      id: `${item.url}-${index}`,
      position: "50% 50%",
      scale: 1
    }));
  }

  const primary = media[0];
  if (!primary) return [];
  return cropViews.map((crop, index) => ({
    ...primary,
    ...crop,
    id: `${primary.url}-crop-${index}`,
    alt: index === 0 ? primary.alt : `${primary.alt}, detail view ${index + 1}`
  }));
}

export function ProductGallery({ media, title }: { media: ProductMedia[]; title: string }) {
  const views = useMemo(() => buildViews(media), [media]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const active = views[activeIndex] ?? views[0];

  useEffect(() => {
    if (!zoomed) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [zoomed]);

  if (!active) return null;

  return (
    <>
      <div className="pdp-gallery">
        <div className="pdp-thumbnails" aria-label={`${title} image views`}>
          <button
            className="pdp-thumbnail-arrow"
            type="button"
            onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            disabled={activeIndex === 0}
            aria-label="Previous product image"
          >
            <ChevronUp size={17} />
          </button>
          {views.map((view, index) => (
            <button
              type="button"
              key={view.id}
              className={index === activeIndex ? "pdp-thumbnail is-active" : "pdp-thumbnail"}
              aria-label={`Show ${title} view ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
            >
              <Image
                src={view.url}
                alt=""
                fill
                sizes="64px"
                style={{ objectPosition: view.position, transform: `scale(${view.scale})` }}
                unoptimized={view.url.startsWith("http")}
              />
            </button>
          ))}
          <button
            className="pdp-thumbnail-arrow"
            type="button"
            onClick={() => setActiveIndex((index) => Math.min(views.length - 1, index + 1))}
            disabled={activeIndex === views.length - 1}
            aria-label="Next product image"
          >
            <ChevronDown size={17} />
          </button>
        </div>

        <div className="pdp-main-image">
          <Image
            src={active.url}
            alt={active.alt}
            fill
            priority
            sizes="(max-width: 760px) 100vw, (max-width: 1100px) 52vw, 620px"
            style={{ objectPosition: active.position, transform: `scale(${active.scale})` }}
            unoptimized={active.url.startsWith("http")}
          />
          <button className="pdp-zoom-button" type="button" onClick={() => setZoomed(true)} aria-label={`Enlarge ${title} image`}>
            <Search size={19} />
          </button>
        </div>
      </div>

      {zoomed ? (
        <div className="pdp-lightbox" role="dialog" aria-modal="true" aria-label={`${title} enlarged image`} onMouseDown={() => setZoomed(false)}>
          <div className="pdp-lightbox-inner" onMouseDown={(event) => event.stopPropagation()}>
            <Image
              src={active.url}
              alt={active.alt}
              fill
              sizes="90vw"
              style={{ objectPosition: active.position }}
              unoptimized={active.url.startsWith("http")}
            />
            <button type="button" onClick={() => setZoomed(false)} aria-label="Close enlarged image">
              <X size={21} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
