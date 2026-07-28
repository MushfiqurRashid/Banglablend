import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getRecipe, getRecipes, type EditorialRecipe, type RecipeIngredient } from "@/lib/sanity/editorial";
import { RecipeCard } from "@/components/editorial/recipe-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { siteConfig } from "@/config/site";
import "../../editorial.css";

const libraryViews = {
  "by-region": { title: "Recipes by region", introduction: "Explore recipes through the places and regional food traditions connected to them.", filter: (recipe: EditorialRecipe) => recipe.hasRegion },
  "by-product": { title: "Recipes by product", introduction: "Find practical ways to cook with Bangla Blend originals, pantry staples and tea blends.", filter: (recipe: EditorialRecipe) => recipe.hasProducts },
  traditional: { title: "Traditional recipes", introduction: "Dishes connected to established Bengali food traditions, presented with context and careful testing.", filter: (recipe: EditorialRecipe) => recipe.librarySections.includes("traditional") },
  "everyday-cooking": { title: "Everyday cooking", introduction: "Flexible, approachable recipes made for the rhythm of the everyday kitchen.", filter: (recipe: EditorialRecipe) => recipe.librarySections.includes("everyday-cooking") }
} satisfies Record<string, { title: string; introduction: string; filter: (recipe: EditorialRecipe) => boolean }>;

function amount(value?: number, unit?: string) {
  return [value, unit].filter((part) => part !== undefined && part !== "").join(" ");
}

function ingredientJson(ingredient: RecipeIngredient) {
  return [amount(ingredient.amount, ingredient.unit), ingredient.name, ingredient.note].filter(Boolean).join(" ");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const libraryView = libraryViews[slug as keyof typeof libraryViews];
  if (libraryView) return { title: libraryView.title, description: libraryView.introduction };
  const recipe = await getRecipe(slug);
  return { title: recipe?.title ?? "Recipe not found", description: recipe?.excerpt, robots: { index: recipe?.verified === true, follow: recipe?.verified === true } };
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const libraryView = libraryViews[slug as keyof typeof libraryViews];
  if (libraryView) {
    const filteredRecipes = (await getRecipes()).filter(libraryView.filter);
    return <><header className="page-hero"><PageContainer><Breadcrumbs items={[{ label: "Recipe Library", href: "/recipes" }, { label: libraryView.title }]} /><span className="eyebrow">Recipe Library</span><h1>{libraryView.title}</h1><p className="lead">{libraryView.introduction}</p></PageContainer></header><Section><PageContainer><nav className="filter-chips" aria-label="Browse the recipe library"><Link className="filter-chip" href="/recipes">All recipes</Link>{Object.entries(libraryViews).map(([viewSlug, view]) => <Link className={`filter-chip${viewSlug === slug ? " active" : ""}`} href={`/recipes/${viewSlug}`} key={viewSlug}>{view.title.replace("Recipes ", "").replace("recipes", "")}</Link>)}</nav>{filteredRecipes.length ? <div className="editorial-grid">{filteredRecipes.map((recipe) => <RecipeCard key={recipe.slug} recipe={recipe} />)}</div> : <div className="empty-state"><h3>No reviewed recipes in this view yet</h3><p>Recipes will appear here once their connections and cooking guidance are approved.</p></div>}</PageContainer></Section></>;
  }

  const recipe = await getRecipe(slug);
  if (!recipe) notFound();
  const recipeJsonLd = { "@context": "https://schema.org", "@type": "Recipe", name: recipe.title, description: recipe.excerpt, image: recipe.image, prepTime: `PT${recipe.prepTime}M`, cookTime: `PT${recipe.cookTime}M`, recipeYield: `${recipe.servings} servings`, recipeIngredient: recipe.ingredients.map(ingredientJson), recipeInstructions: recipe.steps.map((step) => ({ "@type": "HowToStep", text: step.instruction })), url: `${siteConfig.url}/recipes/${recipe.slug}` };

  return <>
    <div className="recipe-hero"><div className="recipe-hero-media"><Image src={recipe.image} alt={recipe.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 50vw" /></div><div className="recipe-hero-copy"><span className="eyebrow">Recipe · {recipe.region}</span><h1>{recipe.title}</h1><p className="lead">{recipe.excerpt}</p><div className="recipe-stats"><div className="recipe-stat"><span>Prep</span><strong>{recipe.prepTime} min</strong></div><div className="recipe-stat"><span>Cook</span><strong>{recipe.cookTime} min</strong></div><div className="recipe-stat"><span>Serves</span><strong>{recipe.servings}</strong></div><div className="recipe-stat"><span>Level</span><strong>{recipe.difficulty}</strong></div></div></div></div>
    <Section><PageContainer>{!recipe.verified ? <div className="verification-notice" style={{ marginBottom: "3rem" }}><ShieldCheck size={23} /><p><strong>Development preview:</strong> This draft must complete recipe testing and editorial verification before production publication.</p></div> : null}<div className="recipe-body"><aside><span className="eyebrow">Ingredients</span><h2>What you’ll need</h2><ul className="ingredient-list">{recipe.ingredients.map((ingredient, index) => { const metric = amount(ingredient.amount, ingredient.unit); const imperial = amount(ingredient.imperialAmount, ingredient.imperialUnit); return <li key={`${ingredient.name}-${index}`}><strong>{metric || "As needed"}{imperial ? <small>{imperial}</small> : null}</strong><span>{ingredient.banglaName || ingredient.name}{ingredient.banglaName ? <small>{ingredient.name}</small> : null}{ingredient.note ? <small>{ingredient.note}</small> : null}</span></li>; })}</ul></aside><div><span className="eyebrow">Method</span><h2>Cook step by step</h2><ol className="step-list">{recipe.steps.map((step, index) => <li key={`${index}-${step.instruction}`}>{step.instruction}{step.timerMinutes ? <small>{step.timerMinutes} minutes</small> : null}</li>)}</ol><div className="verification-notice"><ShieldCheck size={23} /><p>Substitutions and cooking claims are published only after they are tested and approved.</p></div></div></div></PageContainer></Section>
    {recipe.verified ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd).replace(/</g, "\\u003c") }} /> : null}
  </>;
}
