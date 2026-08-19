"use server";

import { revalidatePath } from "next/cache";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { revalidateStorefrontContent } from "@/lib/storefront-revalidation";

export interface RecipeStructureState {
  error?: string;
  success?: string;
  warning?: string;
}

interface IngredientInput {
  ingredientId: string;
  displayAmount: string;
  note: string;
}

interface IngredientGroupInput {
  title: string;
  ingredients: IngredientInput[];
}

interface StepInput {
  instruction: string;
  timerMinutes: string;
}

interface StepSectionInput {
  title: string;
  steps: StepInput[];
}

interface StructurePayload {
  ingredientGroups: IngredientGroupInput[];
  stepSections: StepSectionInput[];
}

function readPayload(raw: FormDataEntryValue | null): StructurePayload {
  if (typeof raw !== "string") throw new Error("Recipe structure is missing.");
  const value = JSON.parse(raw) as Partial<StructurePayload>;
  if (!Array.isArray(value.ingredientGroups) || !Array.isArray(value.stepSections)) throw new Error("Recipe structure is invalid.");
  if (!value.ingredientGroups.length || !value.stepSections.length) throw new Error("Add at least one ingredient group and one method section.");
  for (const group of value.ingredientGroups) {
    if (!group.title?.trim() || !Array.isArray(group.ingredients) || !group.ingredients.length) throw new Error("Every ingredient group needs a title and at least one ingredient.");
    if (group.ingredients.some((ingredient) => !ingredient.ingredientId)) throw new Error(`Choose an ingredient for every row in “${group.title}”.`);
  }
  for (const section of value.stepSections) {
    if (!section.title?.trim() || !Array.isArray(section.steps) || !section.steps.length) throw new Error("Every method section needs a title and at least one step.");
    if (section.steps.some((step) => !step.instruction?.trim())) throw new Error(`Write an instruction for every step in “${section.title}”.`);
  }
  return value as StructurePayload;
}

export async function updateRecipeStructureAction(recipeId: string, _previous: RecipeStructureState | undefined, formData: FormData): Promise<RecipeStructureState> {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "content", "manage")) return { error: "You do not have permission to edit recipes." };

  let structure: StructurePayload;
  try {
    structure = readPayload(formData.get("structure"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Recipe structure is invalid." };
  }

  const ingredientRows = structure.ingredientGroups.flatMap((group, groupIndex) => group.ingredients.map((ingredient, index) => ({
    ingredient_id: ingredient.ingredientId,
    display_amount: ingredient.displayAmount.trim() || null,
    amount: null,
    unit: null,
    imperial_amount: null,
    imperial_unit: null,
    note: ingredient.note.trim() || null,
    group_label: group.title.trim(),
    group_sort_order: groupIndex,
    sort_order: index,
  })));
  for (const step of structure.stepSections.flatMap((section) => section.steps)) {
    const timer = step.timerMinutes.trim() ? Number(step.timerMinutes) : null;
    if (timer !== null && (!Number.isInteger(timer) || timer <= 0)) return { error: "Step timers must be positive whole minutes." };
  }
  const stepRows = structure.stepSections.flatMap((section, sectionIndex) => section.steps.map((step, index) => {
    const timer = step.timerMinutes.trim() ? Number(step.timerMinutes) : null;
    return {
      instruction: step.instruction.trim(),
      timer_minutes: timer,
      section_label: section.title.trim(),
      section_sort_order: sectionIndex,
      sort_order: index,
    };
  }));

  const supabase = await getSupabaseForRequest();
  const recipeClient = supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
  const { error } = await recipeClient.rpc("replace_recipe_structure", {
    target_recipe_id: recipeId,
    ingredient_rows: ingredientRows,
    step_rows: stepRows,
  });
  if (error) return { error: error.message };

  const warning = await revalidateStorefrontContent();
  await recordAudit(supabase, session, {
    action: "recipe.structure_updated",
    resourceType: "recipes",
    resourceId: recipeId,
    summary: `Updated ${ingredientRows.length} ingredients and ${stepRows.length} method steps.${warning ? " Storefront cache refresh needs attention." : ""}`,
    after: { ingredientGroups: structure.ingredientGroups.length, stepSections: structure.stepSections.length },
  });
  revalidatePath(`/content/recipes/${recipeId}`);
  return { success: "Ingredients and method saved.", warning: warning ?? undefined };
}
