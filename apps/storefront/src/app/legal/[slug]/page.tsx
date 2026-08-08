import type { ComponentProps } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { StandardPage } from "@/components/editorial/standard-page";
import { sanityFetch } from "@/lib/sanity/client";
import { LEGAL_PAGE_QUERY } from "@/lib/sanity/queries";
import { titleFromSlug } from "@/lib/utils";
import "../../(editorial)/editorial.css";

const valid = new Set(["shipping-policy", "returns-refund-policy", "privacy-policy", "terms-and-conditions", "cookie-policy"]);
const titles: Record<string, string> = { "returns-refund-policy": "Returns & Refund Policy" };

interface ApprovedLegalPage {
  title: string;
  introduction?: string;
  body?: ComponentProps<typeof PortableText>["value"];
  effectiveDate: string;
}
function previewAllowed() {
  return true;
}

async function getLegalPage(slug: string) {
  return sanityFetch<ApprovedLegalPage>(LEGAL_PAGE_QUERY, { slug });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = valid.has(slug) ? await getLegalPage(slug) : null;
  return { title: page?.title ?? titles[slug] ?? titleFromSlug(slug), robots: { index: Boolean(page), follow: Boolean(page) } };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "returns-policy") redirect("/legal/returns-refund-policy");
  if (!valid.has(slug)) notFound();
  const page = await getLegalPage(slug);
  if (!page && !previewAllowed()) notFound();
  const title = page?.title ?? titles[slug] ?? titleFromSlug(slug);

  if (page) {
    return <StandardPage eyebrow={`Effective ${page.effectiveDate}`} title={title} introduction={page.introduction ?? "Approved Bangla Blend customer policy."}><article className="article-body">{page.body ? <PortableText value={page.body} /> : null}</article></StandardPage>;
  }

  return <StandardPage eyebrow="Legal preview" title={title} introduction="This page is intentionally excluded from search until qualified legal and operational reviewers approve it in Sanity."><div className="verification-notice"><p>No policy text is published from code. Add the reviewed policy, effective date and approval record in Sanity to make this route indexable.</p></div></StandardPage>;
}
