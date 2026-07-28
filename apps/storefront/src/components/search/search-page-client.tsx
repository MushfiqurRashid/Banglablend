"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { SearchDocument } from "@bangla-blend/types";

function href(result: SearchDocument) {
  return result.type === "product" ? `/products/${result.slug}` : result.type === "gift" ? `/gifts/${result.slug}` : result.type === "recipe" ? `/recipes/${result.slug}` : result.type === "article" ? `/discover-bangladesh/${result.slug}` : result.type === "division" || result.type === "region" ? "/discover-bangladesh/regional-flavours" : `/search?q=${encodeURIComponent(result.title)}`;
}

export function SearchPageClient() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [hits, setHits] = useState<SearchDocument[]>([]);
  const [loading, setLoading] = useState(Boolean(initial));
  const [source, setSource] = useState<string>();
  useEffect(() => {
    if (!initial) { setHits([]); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(initial)}`, { signal: controller.signal }).then((response) => response.json()).then((data: { hits?: SearchDocument[]; source?: string }) => { setHits(data.hits ?? []); setSource(data.source); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [initial]);
  return <div><form className="search-page-form" role="search" onSubmit={(event) => { event.preventDefault(); router.push(`/search?q=${encodeURIComponent(query.trim())}`); }}><Search /><label className="sr-only" htmlFor="full-search">Search</label><input id="full-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, gifts, recipes, regions, ingredients and stories" /><button className="button button-primary" type="submit">Search</button></form>{source === "development-preview" ? <p className="preview-note">Development preview results. Configure Meilisearch for production search.</p> : null}{loading ? <div className="empty-state"><h3>Searching…</h3></div> : initial && !hits.length ? <div className="empty-state"><h3>No results for “{initial}”</h3><p>Try an alternate spelling, a region or an ingredient. Popular: Mezban, Chattogram, mustard hilsa.</p></div> : <div className="search-results">{hits.map((result) => <Link key={`${result.type}-${result.id}`} href={href(result)} className="search-result"><span>{result.type}</span><h3>{result.title}</h3><p>{result.excerpt}</p></Link>)}</div>}</div>;
}
