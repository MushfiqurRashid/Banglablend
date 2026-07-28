import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { SearchPageClient } from "@/components/search/search-page-client";
import "./search.css";

export const metadata: Metadata = { title: "Search", description: "Search Bangla Blend products, gifts, recipes, regions, ingredients and stories." };

export default function SearchPage() {
  return <><header className="page-hero"><PageContainer><span className="eyebrow">Find flavor and story</span><h1>Search Bangla Blend</h1></PageContainer></header><section className="section"><PageContainer><Suspense fallback={<div className="empty-state"><h3>Preparing search…</h3></div>}><SearchPageClient /></Suspense></PageContainer></section></>;
}
