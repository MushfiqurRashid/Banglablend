"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, Search, SlidersHorizontal } from "lucide-react";
import type { EditorialRecipe } from "@/lib/content/editorial";
import { PageContainer } from "@/components/layout/page-container";

const filters = ["All", "Fish & seafood", "Meat & poultry", "Vegetarian"] as const;

export function RecipeLibrary({
  recipes,
  title = "Find your next dish",
  kicker = "The collection",
}: {
  recipes: EditorialRecipe[];
  title?: string;
  kicker?: string;
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return recipes.filter((recipe) => {
      const matchesFilter = filter === "All" || recipe.category === filter;
      const matchesQuery = !term || [recipe.title, recipe.banglaTitle, recipe.excerpt, recipe.region, recipe.category]
        .filter(Boolean).join(" ").toLocaleLowerCase().includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, recipes]);

  return (
    <section id="recipe-library" className="recipe-library-browser" aria-labelledby="all-recipes-title">
      <PageContainer>
        <div className="recipe-library-browser-head">
          <div><span className="recipe-kicker">{kicker}</span><h2 id="all-recipes-title">{title}</h2></div>
          <label className="recipe-search">
            <Search size={17} aria-hidden="true" /><span className="sr-only">Search recipes</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dish, ingredient or region" />
          </label>
        </div>

        <div className="recipe-filter-row" aria-label="Filter recipes">
          <span className="recipe-filter-label"><SlidersHorizontal size={15} aria-hidden="true" /> Filter</span>
          {filters.map((option) => (
            <button type="button" key={option} className={filter === option ? "is-active" : undefined} aria-pressed={filter === option} onClick={() => setFilter(option)}>{option}</button>
          ))}
          <span className="recipe-result-count" aria-live="polite">{shown.length} {shown.length === 1 ? "recipe" : "recipes"}</span>
        </div>

        {shown.length ? (
          <div className="recipe-premium-grid">
            {shown.map((recipe, index) => (
              <article className="recipe-premium-card" key={recipe.slug}>
                <Link href={`/recipes/${recipe.slug}`} className="recipe-premium-card-link">
                  <span className="recipe-premium-card-media">
                    <Image src={recipe.image} alt={recipe.imageAlt} fill sizes="(max-width: 680px) 100vw, (max-width: 1050px) 50vw, 33vw" />
                    <span className="recipe-premium-card-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="recipe-premium-card-arrow"><ArrowUpRight size={18} aria-hidden="true" /></span>
                  </span>
                  <span className="recipe-premium-card-body">
                    <span className="recipe-premium-card-overline">{recipe.region} <i aria-hidden="true" /> {recipe.category}</span>
                    <span className="recipe-premium-card-titles"><strong>{recipe.title}</strong>{recipe.banglaTitle ? <span lang="bn">{recipe.banglaTitle}</span> : null}</span>
                    <span className="recipe-premium-card-description">{recipe.excerpt}</span>
                    <span className="recipe-premium-card-meta"><span><Clock3 size={14} aria-hidden="true" /> {recipe.totalTime} min</span><span>{recipe.difficulty}</span></span>
                  </span>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="recipe-empty-state"><h3>No recipes found</h3><p>Try another dish, region or category.</p><button type="button" onClick={() => { setQuery(""); setFilter("All"); }}>Clear filters</button></div>
        )}
      </PageContainer>
    </section>
  );
}
