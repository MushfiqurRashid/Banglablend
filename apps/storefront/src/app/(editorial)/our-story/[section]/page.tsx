import type { ComponentProps } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { ComingSoonPage } from "@/components/editorial/coming-soon-page";
import { StandardPage } from "@/components/editorial/standard-page";
import { meetAnnapurnaComingSoonPage } from "@/config/coming-soon";
import { sanityFetch } from "@/lib/sanity/client";
import { STANDARD_PAGE_QUERY } from "@/lib/sanity/queries";
import { ImpactPage } from "./impact-page";
import "../../editorial.css";
import "./impact-page.css";

const storyPages = {
  "about-bangla-blend": {
    eyebrow: "Our beginning",
    title: "About Bangla Blend",
    introduction:
      "A Bangladeshi food and lifestyle brand created to carry exceptional flavour and carefully told stories into kitchens everywhere.",
    lead: "Bangla Blend begins with spices because flavour is an immediate invitation into culture.",
    paragraphs: [
      "The collection brings together regionally inspired blends, identifiable ingredients, useful pantry products and gifts. Recipes and editorial stories help each product connect with the dishes, places and people that give it context.",
      "The ambition is global, but the point of view remains distinctly Bangladeshi: generous, layered, resourceful and alive to regional difference.",
    ],
  },
  "our-philosophy": {
    eyebrow: "What guides us",
    title: "Our Philosophy",
    introduction:
      "Taste, story and community belong together. Each deserves the same attention to quality and care.",
    lead: "Taste earns the first place at the table; context makes the experience deeper.",
    paragraphs: [
      "Products should be useful and delicious before they carry a larger story. When a product connects to a dish, place or memory, that connection should be specific, reviewed and respectful.",
      "Growth should also create meaningful value for the people behind the ingredients and ideas. Bangla Blend treats that as a commitment to build toward, not a claim to make before evidence exists.",
    ],
  },
  "our-impact": {
    eyebrow: "Progress with evidence",
    title: "Our Impact",
    introduction:
      "Bangla Blend is building the systems needed to measure value responsibly and report progress without exaggeration.",
    lead: "An impact ambition becomes trustworthy only when the method, baseline and result can be explained.",
    paragraphs: [
      "Potential measures include the share of traceable ingredients, supplier payment practices, verified producer relationships, packaging choices and the value returned through lasting partnerships.",
      "No livelihood, environmental or community outcome is published as fact until the supporting records have been reviewed. As programmes mature, this page can report dated measures, methods and limitations.",
    ],
  },
} satisfies Record<
  string,
  {
    eyebrow: string;
    title: string;
    introduction: string;
    lead: string;
    paragraphs: string[];
  }
>;

export const dynamicParams = false;

export function generateStaticParams() {
  return [...Object.keys(storyPages), "meet-annapurna"].map((section) => ({ section }));
}

interface ApprovedStoryPage {
  title: string;
  introduction?: string;
  body?: ComponentProps<typeof PortableText>["value"];
}

function previewAllowed() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_DEVELOPMENT_FALLBACKS === "true"
  );
}

async function getStoryPage(slug: string) {
  return sanityFetch<ApprovedStoryPage>(STANDARD_PAGE_QUERY, { slug });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  if (section === "meet-annapurna") {
    return {
      title: `${meetAnnapurnaComingSoonPage.title} — Coming Soon`,
      description: meetAnnapurnaComingSoonPage.description,
    };
  }
  const page = storyPages[section as keyof typeof storyPages];
  const approvedPage = page ? await getStoryPage(section) : null;
  return {
    title: approvedPage?.title ?? page?.title ?? "Our Story",
    description: approvedPage?.introduction ?? page?.introduction,
    robots: { index: Boolean(approvedPage), follow: Boolean(approvedPage) },
  };
}

export default async function StorySectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section === "meet-annapurna") {
    return <ComingSoonPage {...meetAnnapurnaComingSoonPage} />;
  }

  const page = storyPages[section as keyof typeof storyPages];
  if (!page) notFound();
  if (section === "our-impact") return <ImpactPage />;

  const approvedPage = await getStoryPage(section);
  if (approvedPage) {
    return (
      <StandardPage
        eyebrow={page.eyebrow}
        title={approvedPage.title}
        introduction={approvedPage.introduction ?? page.introduction}
      >
        <article className="article-body">
          {approvedPage.body ? <PortableText value={approvedPage.body} /> : null}
        </article>
      </StandardPage>
    );
  }
  if (!previewAllowed()) notFound();

  return (
    <StandardPage
      eyebrow={page.eyebrow}
      title={page.title}
      introduction={page.introduction}
    >
      <div className="editorial-intro">
        <div>
          <h2>{page.lead}</h2>
        </div>
        <div className="editorial-intro-copy">
          {page.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </StandardPage>
  );
}
