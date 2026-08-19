"use client";

import { ListChecks, Printer } from "lucide-react";

export function RecipeToolbar() {
  return (
    <div className="recipe-toolbar" aria-label="Recipe actions">
      <a href="#ingredients"><ListChecks size={16} aria-hidden="true" /> Jump to ingredients</a>
      <button type="button" onClick={() => window.print()}><Printer size={16} aria-hidden="true" /> Print recipe</button>
    </div>
  );
}
