import { notFound, redirect } from "next/navigation";
import { articles, journalCategories } from "@/lib/content/fallback-content";

export default async function JournalSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categoryAliases: Record<string, string> = {
    "regional-flavors": "regional-flavours",
    ingredients: "ingredient-stories",
    "festival-seasonal": "festivals-seasons"
  };
  const categorySlug = categoryAliases[slug] ?? slug;
  const category = journalCategories.find((item) => item.slug === categorySlug);
  if (category) redirect(`/discover-bangladesh/${category.slug}`);

  const article = articles.find((item) => item.slug === slug);
  if (article) redirect(`/discover-bangladesh/${article.categorySlug}/${article.slug}`);
  notFound();
}
