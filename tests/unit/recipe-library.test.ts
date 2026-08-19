import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { launchRecipes } from "../../apps/storefront/src/data/launch-recipes";

describe("premium recipe launch library", () => {
  it("publishes nine complete, verified recipes with three responsive image crops", () => {
    expect(launchRecipes).toHaveLength(9);
    expect(new Set(launchRecipes.map((recipe) => recipe.slug)).size).toBe(9);
    for (const recipe of launchRecipes) {
      expect(recipe.verified).toBe(true);
      expect(recipe.ingredientGroups.length).toBeGreaterThan(0);
      expect(recipe.stepSections.flatMap((section) => section.steps).length).toBeGreaterThan(2);
      expect(recipe.image).toMatch(/\.webp$/);
      expect(recipe.imageWide).toContain("-wide.webp");
      expect(recipe.imageSquare).toContain("-square.webp");
      for (const image of [recipe.image, recipe.imageWide, recipe.imageSquare]) {
        expect(existsSync(join(process.cwd(), "apps/storefront/public", image))).toBe(true);
      }
      expect(recipe.totalTime).toBeGreaterThanOrEqual(recipe.prepTime + recipe.cookTime);
    }
  });

  it("does not repeat the unsafe room-temperature storage claim from the source document", () => {
    const chicken = launchRecipes.find((recipe) => recipe.slug === "chicken-achar");
    expect(chicken?.storage).toContain("3–4 days");
    expect(chicken?.storage?.toLocaleLowerCase()).not.toContain("room temperature");
    expect(chicken?.safety).toMatch(/74°C\s*\/\s*165°F/);
  });
});
