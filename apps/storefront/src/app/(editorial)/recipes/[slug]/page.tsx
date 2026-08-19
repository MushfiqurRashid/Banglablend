import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChefHat, Clock3, MapPin, ShieldCheck, UsersRound } from "lucide-react";
import { RecipeLibrary } from "@/components/editorial/recipe-library";
import { RecipeToolbar } from "@/components/editorial/recipe-toolbar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { getRecipe, getRecipes, type RecipeIngredient } from "@/lib/content/editorial";
import { siteConfig } from "@/config/site";
import "../recipes.css";

const collections = {
  traditional: {
    kicker: "Heritage collection",
    title: "Traditional recipes",
    description: "Beloved preparations carried across generations, documented with clarity for today’s kitchen.",
    filter: (recipe: Awaited<ReturnType<typeof getRecipes>>[number]) => recipe.librarySections.includes("traditional"),
  },
  "everyday-cooking": {
    kicker: "Weekday collection",
    title: "Everyday cooking",
    description: "Practical, deeply flavoured dishes designed to earn a regular place at your table.",
    filter: (recipe: Awaited<ReturnType<typeof getRecipes>>[number]) => recipe.librarySections.includes("everyday-cooking"),
  },
  "by-region": {
    kicker: "A culinary map",
    title: "Recipes by region",
    description: "Follow the distinct ingredients, techniques and appetites that shape food across Bangladesh.",
    filter: () => true,
  },
  "by-product": {
    kicker: "From the Bangla Blend pantry",
    title: "Cook by product",
    description: "Recipes paired thoughtfully with the spices and pantry essentials that help them sing.",
    filter: (recipe: Awaited<ReturnType<typeof getRecipes>>[number]) => recipe.hasProducts,
  },
} as const;

function ingredientText(ingredient: RecipeIngredient) {
  const amount = ingredient.displayAmount ?? [ingredient.amount, ingredient.unit].filter((value) => value !== undefined && value !== "").join(" ");
  return [amount, ingredient.name, ingredient.note].filter(Boolean).join(" ");
}

function absoluteImage(path: string) {
  return path.startsWith("http") ? path : `${siteConfig.url}${path}`;
}

export async function generateStaticParams() {
  const recipes = await getRecipes();
  return [...Object.keys(collections), ...recipes.map((recipe) => recipe.slug)].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = collections[slug as keyof typeof collections];
  if (collection) {
    return {
      title: `${collection.title} | Bangla Blend Kitchen`,
      description: collection.description,
      alternates: { canonical: `/recipes/${slug}` },
    };
  }
  const recipe = await getRecipe(slug);
  if (!recipe) return { title: "Recipe not found" };
  return {
    title: `${recipe.title} | Bangladeshi Recipe`,
    description: recipe.excerpt,
    alternates: { canonical: `/recipes/${recipe.slug}` },
    robots: { index: recipe.verified, follow: recipe.verified },
    openGraph: {
      type: "article",
      title: recipe.title,
      description: recipe.excerpt,
      url: `/recipes/${recipe.slug}`,
      publishedTime: recipe.publishedAt,
      images: [{ url: recipe.imageWide, width: 1600, height: 900, alt: recipe.imageAlt }],
    },
  };
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = collections[slug as keyof typeof collections];
  if (collection) {
    const recipes = (await getRecipes()).filter(collection.filter);
    return (
      <main className="recipe-library-page recipe-collection-page">
        <PageContainer className="recipe-collection-hero">
          <Breadcrumbs items={[{ label: "Recipes", href: "/recipes" }, { label: collection.title }]} />
          <span className="recipe-kicker">{collection.kicker}</span>
          <h1>{collection.title}</h1>
          <p>{collection.description}</p>
          <Link href="/recipes" className="recipe-text-link"><ArrowLeft size={16} aria-hidden="true" /> All recipes</Link>
        </PageContainer>
        <RecipeLibrary recipes={recipes} title={`Explore ${collection.title.toLocaleLowerCase()}`} kicker={`${recipes.length} kitchen-tested recipes`} />
      </main>
    );
  }

  const recipe = await getRecipe(slug);
  if (!recipe) notFound();
  const moreRecipes = (await getRecipes()).filter((item) => item.slug !== recipe.slug).slice(0, 3);
  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    alternateName: recipe.banglaTitle,
    description: recipe.excerpt,
    image: [recipe.imageSquare, recipe.image, recipe.imageWide].map(absoluteImage),
    author: { "@type": "Organization", name: recipe.author },
    datePublished: recipe.publishedAt,
    prepTime: `PT${recipe.prepTime}M`,
    cookTime: `PT${recipe.cookTime}M`,
    totalTime: `PT${recipe.totalTime}M`,
    recipeYield: recipe.yield,
    recipeCategory: recipe.category,
    recipeCuisine: recipe.cuisine,
    keywords: [recipe.region, ...(recipe.dietaryTags ?? []), "Bangladeshi recipe"].join(", "),
    recipeIngredient: recipe.ingredients.map(ingredientText),
    recipeInstructions: recipe.stepSections.map((section) => ({
      "@type": "HowToSection",
      name: section.title,
      itemListElement: section.steps.map((step) => ({ "@type": "HowToStep", text: step.instruction })),
    })),
    url: `${siteConfig.url}/recipes/${recipe.slug}`,
  };
  let stepNumber = 0;

  return (
    <main className="recipe-detail-page">
      <PageContainer className="recipe-detail-breadcrumbs">
        <Breadcrumbs items={[{ label: "Recipes", href: "/recipes" }, { label: recipe.title }]} />
      </PageContainer>

      <section className="recipe-detail-hero" aria-labelledby="recipe-title">
        <PageContainer className="recipe-detail-hero-grid">
          <div className="recipe-detail-hero-copy">
            <span className="recipe-kicker">{recipe.category} · {recipe.region}</span>
            <h1 id="recipe-title">{recipe.title}</h1>
            {recipe.banglaTitle ? <p className="recipe-bangla-title" lang="bn">{recipe.banglaTitle}</p> : null}
            <p className="recipe-detail-dek">{recipe.excerpt}</p>
            <div className="recipe-detail-stats">
              <div><Clock3 aria-hidden="true" /><span>Prep</span><strong>{recipe.prepTime} min</strong></div>
              <div><ChefHat aria-hidden="true" /><span>Cook</span><strong>{recipe.cookTime} min</strong></div>
              <div><UsersRound aria-hidden="true" /><span>Yield</span><strong>{recipe.yield}</strong></div>
              <div><MapPin aria-hidden="true" /><span>Level</span><strong>{recipe.difficulty}</strong></div>
            </div>
            <RecipeToolbar />
          </div>
          <figure className="recipe-detail-hero-media">
            <Image src={recipe.imageWide} alt={recipe.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 55vw" />
            {recipe.imageCredit ? <figcaption>Image: {recipe.imageCredit}</figcaption> : null}
          </figure>
        </PageContainer>
      </section>

      <PageContainer className="recipe-detail-story">
        <span className="recipe-kicker">At the table</span>
        <p>{recipe.story ?? recipe.excerpt}</p>
        <div className="recipe-detail-tags">{recipe.dietaryTags.map((tag) => <span key={tag}><Check size={13} aria-hidden="true" /> {tag}</span>)}</div>
      </PageContainer>

      <PageContainer className="recipe-detail-body">
        <aside id="ingredients" className="recipe-ingredients-panel">
          <div className="recipe-section-heading"><span className="recipe-kicker">Mise en place</span><h2>Ingredients</h2><p>{recipe.yield}</p></div>
          {recipe.ingredientGroups.map((group) => (
            <section className="recipe-ingredient-group" key={group.title} aria-labelledby={`ingredient-${group.title.replaceAll(" ", "-").toLocaleLowerCase()}`}>
              <h3 id={`ingredient-${group.title.replaceAll(" ", "-").toLocaleLowerCase()}`}>{group.title}</h3>
              <ul>
                {group.ingredients.map((ingredient, index) => (
                  <li key={`${group.title}-${ingredient.name}-${index}`}>
                    <span className="recipe-ingredient-amount">{(ingredient.displayAmount ?? [ingredient.amount, ingredient.unit].filter(Boolean).join(" ")) || "As needed"}</span>
                    <span><strong>{ingredient.name}</strong>{ingredient.note ? <small>{ingredient.note}</small> : null}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </aside>

        <article className="recipe-method">
          <div className="recipe-section-heading"><span className="recipe-kicker">The method</span><h2>Cook step by step</h2><p>Read through once before you begin.</p></div>
          {recipe.stepSections.map((section) => (
            <section className="recipe-step-section" key={section.title}>
              <h3>{section.title}</h3>
              <ol>
                {section.steps.map((step) => {
                  stepNumber += 1;
                  return (
                    <li key={`${stepNumber}-${step.instruction}`}>
                      <span className="recipe-step-number">{String(stepNumber).padStart(2, "0")}</span>
                      <div><p>{step.instruction}</p>{step.timerMinutes ? <small><Clock3 size={14} aria-hidden="true" /> {step.timerMinutes} minutes</small> : null}</div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </article>
      </PageContainer>

      <section className="recipe-detail-notes">
        <PageContainer>
          <div className="recipe-notes-heading"><span className="recipe-kicker">Kitchen notes</span><h2>Make it beautifully</h2></div>
          <div className="recipe-notes-grid">
            <article><h3>Cook’s notes</h3><ul>{recipe.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></article>
            <article><h3>Serve with</h3><ul>{recipe.servingSuggestions.map((item) => <li key={item}>{item}</li>)}</ul></article>
            {(recipe.storage || recipe.safety) ? <article className="recipe-safety-note"><ShieldCheck aria-hidden="true" /><h3>Store &amp; serve safely</h3>{recipe.storage ? <p>{recipe.storage}</p> : null}{recipe.safety ? <p>{recipe.safety}</p> : null}</article> : null}
          </div>
        </PageContainer>
      </section>

      {recipe.relatedProducts.length ? (
        <section className="recipe-product-pairing">
          <PageContainer>
            <div className="recipe-notes-heading"><span className="recipe-kicker">From our pantry</span><h2>Spices for this recipe</h2></div>
            <div className="recipe-product-grid">
              {recipe.relatedProducts.map((product) => (
                <Link href={`/products/${product.handle}`} key={product.handle} className="recipe-product-card">
                  {product.image ? <span><Image src={product.image} alt="" fill sizes="180px" /></span> : null}
                  <div><h3>{product.title}</h3>{product.note ? <p>{product.note}</p> : null}<em>Shop this spice <ArrowRight size={14} aria-hidden="true" /></em></div>
                </Link>
              ))}
            </div>
          </PageContainer>
        </section>
      ) : null}

      <section className="recipe-more">
        <PageContainer>
          <div className="recipe-more-heading"><div><span className="recipe-kicker">Keep cooking</span><h2>More from the kitchen</h2></div><Link href="/recipes" className="recipe-text-link">View all recipes <ArrowRight size={15} aria-hidden="true" /></Link></div>
          <div className="recipe-more-grid">
            {moreRecipes.map((item) => (
              <article key={item.slug}><Link href={`/recipes/${item.slug}`}><span className="recipe-more-media"><Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 700px) 100vw, 33vw" /></span><span className="recipe-kicker">{item.region} · {item.totalTime} min</span><h3>{item.title}</h3></Link></article>
            ))}
          </div>
        </PageContainer>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd).replace(/</g, "\\u003c") }} />
    </main>
  );
}
