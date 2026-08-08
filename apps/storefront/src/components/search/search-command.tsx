"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/navigation/smart-link";
import { Search, X, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SearchDocument } from "@bangla-blend/types";
import { useModalDialog } from "@/components/accessibility/use-modal-dialog";

function resultHref(result: SearchDocument) {
  if (result.type === "product") return `/products/${result.slug}`;
  if (result.type === "gift") return `/gifts/${result.slug}`;
  if (result.type === "recipe") return `/recipes/${result.slug}`;
  if (result.type === "article") return `/discover-bangladesh/${result.slug}`;
  if (result.type === "division" || result.type === "region")
    return "/discover-bangladesh/regional-flavours";
  return `/search?q=${encodeURIComponent(result.title)}`;
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useModalDialog(open, () => setOpen(false), dialogRef, inputRef);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { hits?: SearchDocument[] };
        setHits(data.hits ?? []);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <>
      <button
        className="icon-button"
        aria-label="Search"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search size={19} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={dialogRef}
            className="search-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Search Bangla Blend"
            tabIndex={-1}
            initial={reducedMotion ? false : { opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="search-modal-top">
              <div className="search-input-wrap">
                <Search size={21} />
                <label className="sr-only" htmlFor="site-search">
                  Search products and stories
                </label>
                <input
                  ref={inputRef}
                  id="site-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search spices, recipes, regions…"
                  autoComplete="off"
                />
                <span aria-live="polite">{loading ? "Searching…" : "ESC"}</span>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
              >
                <X />
              </button>
            </div>
            <div className="search-modal-body">
              {query.length < 2 ? (
                <div>
                  <span className="eyebrow">Popular searches</span>
                  <div className="search-suggestions">
                    {["Mezban", "Shorisha Ilish", "Chattogram", "Gifts"].map((term) => (
                      <button type="button" key={term} onClick={() => setQuery(term)}>
                        {term}
                        <ArrowUpRight size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : hits.length ? (
                <div>
                  <div className="search-result-head">
                    <span>{hits.length} results</span>
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}`}
                      onClick={() => setOpen(false)}
                    >
                      View all results
                    </Link>
                  </div>
                  <div className="predictive-results">
                    {hits.slice(0, 8).map((result) => (
                      <Link
                        key={`${result.type}-${result.id}`}
                        href={resultHref(result)}
                        onClick={() => setOpen(false)}
                      >
                        <span>{result.type}</span>
                        <strong>{result.title}</strong>
                        <p>{result.excerpt}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : !loading ? (
                <div className="empty-state">
                  <h3>No results yet</h3>
                  <p>Try a product, dish, ingredient or place name.</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
