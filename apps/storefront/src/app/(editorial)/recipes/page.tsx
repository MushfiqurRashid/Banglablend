import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/editorial/coming-soon-page";
import { recipeComingSoonPages } from "@/config/coming-soon";

const page = recipeComingSoonPages.recipes;

export const metadata: Metadata = {
  title: `${page.title} — Coming Soon`,
  description: page.description,
};

export default function RecipesPage() {
  return <ComingSoonPage {...page} />;
}
