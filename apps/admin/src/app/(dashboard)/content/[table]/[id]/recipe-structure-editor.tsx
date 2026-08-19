"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { updateRecipeStructureAction } from "./recipe-structure-actions";

export interface IngredientOption { id: string; label: string }
export interface IngredientEditorRow { ingredientId: string; displayAmount: string; note: string }
export interface IngredientEditorGroup { title: string; ingredients: IngredientEditorRow[] }
export interface StepEditorRow { instruction: string; timerMinutes: string }
export interface StepEditorSection { title: string; steps: StepEditorRow[] }

const emptyIngredient = (): IngredientEditorRow => ({ ingredientId: "", displayAmount: "", note: "" });
const emptyStep = (): StepEditorRow => ({ instruction: "", timerMinutes: "" });

export function RecipeStructureEditor({ recipeId, ingredientOptions, initialIngredientGroups, initialStepSections, readOnly }: {
  recipeId: string;
  ingredientOptions: IngredientOption[];
  initialIngredientGroups: IngredientEditorGroup[];
  initialStepSections: StepEditorSection[];
  readOnly: boolean;
}) {
  const [ingredientGroups, setIngredientGroups] = useState(initialIngredientGroups.length ? initialIngredientGroups : [{ title: "Ingredients", ingredients: [emptyIngredient()] }]);
  const [stepSections, setStepSections] = useState(initialStepSections.length ? initialStepSections : [{ title: "Method", steps: [emptyStep()] }]);
  const [state, action, pending] = useActionState(updateRecipeStructureAction.bind(null, recipeId), undefined);

  const updateIngredientGroup = (groupIndex: number, update: Partial<IngredientEditorGroup>) => setIngredientGroups((groups) => groups.map((group, index) => index === groupIndex ? { ...group, ...update } : group));
  const updateStepSection = (sectionIndex: number, update: Partial<StepEditorSection>) => setStepSections((sections) => sections.map((section, index) => index === sectionIndex ? { ...section, ...update } : section));

  return (
    <section className="card recipe-structure-editor">
      <div className="recipe-editor-heading">
        <div><p className="page-eyebrow">Structured recipe</p><h2>Ingredients &amp; method</h2><p>Group the mise en place and method exactly as readers should follow them.</p></div>
        <span className="badge badge-neutral">{ingredientGroups.flatMap((group) => group.ingredients).length} ingredients · {stepSections.flatMap((section) => section.steps).length} steps</span>
      </div>
      <form action={action}>
        <input type="hidden" name="structure" value={JSON.stringify({ ingredientGroups, stepSections })} />
        <div className="recipe-editor-columns">
          <div>
            <div className="recipe-editor-section-title"><h3>Ingredient groups</h3>{!readOnly ? <button className="btn btn-secondary" type="button" onClick={() => setIngredientGroups((groups) => [...groups, { title: "New group", ingredients: [emptyIngredient()] }])}><Plus /> Add group</button> : null}</div>
            {ingredientGroups.map((group, groupIndex) => (
              <fieldset className="recipe-editor-group" key={`ingredient-${groupIndex}`} disabled={readOnly}>
                <div className="recipe-editor-group-title"><input className="input" aria-label={`Ingredient group ${groupIndex + 1} title`} value={group.title} onChange={(event) => updateIngredientGroup(groupIndex, { title: event.target.value })} />{!readOnly && ingredientGroups.length > 1 ? <button type="button" className="icon-button" aria-label={`Remove ${group.title}`} onClick={() => setIngredientGroups((groups) => groups.filter((_, index) => index !== groupIndex))}><Trash2 /></button> : null}</div>
                {group.ingredients.map((ingredient, ingredientIndex) => (
                  <div className="recipe-editor-ingredient" key={`ingredient-${groupIndex}-${ingredientIndex}`}>
                    <select className="select" aria-label={`Ingredient ${ingredientIndex + 1}`} value={ingredient.ingredientId} onChange={(event) => updateIngredientGroup(groupIndex, { ingredients: group.ingredients.map((row, index) => index === ingredientIndex ? { ...row, ingredientId: event.target.value } : row) })}><option value="">Choose ingredient</option>{ingredientOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select>
                    <input className="input" aria-label="Display amount" placeholder="e.g. 2 tbsp" value={ingredient.displayAmount} onChange={(event) => updateIngredientGroup(groupIndex, { ingredients: group.ingredients.map((row, index) => index === ingredientIndex ? { ...row, displayAmount: event.target.value } : row) })} />
                    <input className="input" aria-label="Ingredient note" placeholder="Preparation note" value={ingredient.note} onChange={(event) => updateIngredientGroup(groupIndex, { ingredients: group.ingredients.map((row, index) => index === ingredientIndex ? { ...row, note: event.target.value } : row) })} />
                    {!readOnly && group.ingredients.length > 1 ? <button type="button" className="icon-button" aria-label="Remove ingredient" onClick={() => updateIngredientGroup(groupIndex, { ingredients: group.ingredients.filter((_, index) => index !== ingredientIndex) })}><Trash2 /></button> : null}
                  </div>
                ))}
                {!readOnly ? <button type="button" className="recipe-editor-add-row" onClick={() => updateIngredientGroup(groupIndex, { ingredients: [...group.ingredients, emptyIngredient()] })}><Plus /> Add ingredient</button> : null}
              </fieldset>
            ))}
          </div>
          <div>
            <div className="recipe-editor-section-title"><h3>Method sections</h3>{!readOnly ? <button className="btn btn-secondary" type="button" onClick={() => setStepSections((sections) => [...sections, { title: "New section", steps: [emptyStep()] }])}><Plus /> Add section</button> : null}</div>
            {stepSections.map((section, sectionIndex) => (
              <fieldset className="recipe-editor-group" key={`section-${sectionIndex}`} disabled={readOnly}>
                <div className="recipe-editor-group-title"><input className="input" aria-label={`Method section ${sectionIndex + 1} title`} value={section.title} onChange={(event) => updateStepSection(sectionIndex, { title: event.target.value })} />{!readOnly && stepSections.length > 1 ? <button type="button" className="icon-button" aria-label={`Remove ${section.title}`} onClick={() => setStepSections((sections) => sections.filter((_, index) => index !== sectionIndex))}><Trash2 /></button> : null}</div>
                {section.steps.map((step, stepIndex) => (
                  <div className="recipe-editor-step" key={`step-${sectionIndex}-${stepIndex}`}>
                    <span>{stepIndex + 1}</span><textarea className="textarea" aria-label={`Step ${stepIndex + 1}`} value={step.instruction} onChange={(event) => updateStepSection(sectionIndex, { steps: section.steps.map((row, index) => index === stepIndex ? { ...row, instruction: event.target.value } : row) })} /><input className="input" type="number" min="1" aria-label="Timer minutes" placeholder="Minutes" value={step.timerMinutes} onChange={(event) => updateStepSection(sectionIndex, { steps: section.steps.map((row, index) => index === stepIndex ? { ...row, timerMinutes: event.target.value } : row) })} />{!readOnly && section.steps.length > 1 ? <button type="button" className="icon-button" aria-label="Remove step" onClick={() => updateStepSection(sectionIndex, { steps: section.steps.filter((_, index) => index !== stepIndex) })}><Trash2 /></button> : null}
                  </div>
                ))}
                {!readOnly ? <button type="button" className="recipe-editor-add-row" onClick={() => updateStepSection(sectionIndex, { steps: [...section.steps, emptyStep()] })}><Plus /> Add step</button> : null}
              </fieldset>
            ))}
          </div>
        </div>
        {state?.error ? <p className="error-text">{state.error}</p> : null}
        {state?.success ? <p className="recipe-editor-success">{state.success}</p> : null}
        {state?.warning ? <div className="notice">{state.warning}</div> : null}
        {!readOnly ? <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Saving structure…" : "Save ingredients & method"}</button> : null}
      </form>
    </section>
  );
}
