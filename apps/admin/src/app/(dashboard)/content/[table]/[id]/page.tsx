import { notFound } from "next/navigation";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { getContentType } from "@/lib/content-registry";
import { loadForeignOptions } from "../foreign-options";
import { deleteContentAction } from "../actions";
import { EditContentClient } from "./edit-content-client";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  RecipeStructureEditor,
  type IngredientEditorGroup,
  type StepEditorSection,
} from "./recipe-structure-editor";

export default async function EditContentPage({ params }: { params: Promise<{ table: string; id: string }> }) {
  const { table, id } = await params;
  const session = await getStaffSession();
  const canManage = hasPermission(session, "content", "manage");
  const contentType = getContentType(table);
  if (!contentType) notFound();

  const supabase = await getSupabaseForRequest();
  const [{ data: row }, foreignOptions] = await Promise.all([supabase.from(table).select("*").eq("id", id).maybeSingle(), loadForeignOptions(supabase, contentType)]);
  if (!row) notFound();

  const label = String((row as Record<string, unknown>)[contentType.titleColumn] ?? "Untitled");
  let recipeStructure: {
    ingredientOptions: Array<{ id: string; label: string }>;
    ingredientGroups: IngredientEditorGroup[];
    stepSections: StepEditorSection[];
  } | null = null;
  if (table === "recipes") {
    const [{ data: ingredientRows }, { data: stepRows }, { data: ingredientOptions }] = await Promise.all([
      supabase.from("recipe_ingredients").select("ingredient_id, display_amount, note, group_label, group_sort_order, sort_order").eq("recipe_id", id).order("group_sort_order").order("sort_order"),
      supabase.from("recipe_steps").select("instruction, timer_minutes, section_label, section_sort_order, sort_order").eq("recipe_id", id).order("section_sort_order").order("sort_order"),
      supabase.from("ingredients").select("id, title").order("title"),
    ]);
    type IngredientRow = { ingredient_id: string; display_amount: string | null; note: string | null; group_label: string | null; group_sort_order: number; sort_order: number };
    type StepRow = { instruction: string; timer_minutes: number | null; section_label: string | null; section_sort_order: number; sort_order: number };
    const typedIngredients = (ingredientRows ?? []) as unknown as IngredientRow[];
    const typedSteps = (stepRows ?? []) as unknown as StepRow[];
    const ingredientTitles = [...new Set(typedIngredients.map((entry) => entry.group_label ?? "Ingredients"))];
    const sectionTitles = [...new Set(typedSteps.map((entry) => entry.section_label ?? "Method"))];
    recipeStructure = {
      ingredientOptions: ((ingredientOptions ?? []) as Array<{ id: string; title: string }>).map((option) => ({ id: option.id, label: option.title })),
      ingredientGroups: ingredientTitles.map((title) => ({
        title,
        ingredients: typedIngredients.filter((entry) => (entry.group_label ?? "Ingredients") === title).map((entry) => ({ ingredientId: entry.ingredient_id, displayAmount: entry.display_amount ?? "", note: entry.note ?? "" })),
      })),
      stepSections: sectionTitles.map((title) => ({
        title,
        steps: typedSteps.filter((entry) => (entry.section_label ?? "Method") === title).map((entry) => ({ instruction: entry.instruction, timerMinutes: entry.timer_minutes?.toString() ?? "" })),
      })),
    };
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{label}</h1>
        {canManage ? <form action={deleteContentAction.bind(null, table, id, label)}>
          <ConfirmSubmitButton message={`Delete "${label}"? This content will be removed permanently.`}>
            Delete
          </ConfirmSubmitButton>
        </form> : null}
      </div>
      {!canManage ? <div className="notice">Your role has read-only access to this content.</div> : null}
      <EditContentClient contentType={contentType} id={id} initial={row as Record<string, unknown>} foreignOptions={foreignOptions} readOnly={!canManage} />
      {recipeStructure ? <RecipeStructureEditor recipeId={id} ingredientOptions={recipeStructure.ingredientOptions} initialIngredientGroups={recipeStructure.ingredientGroups} initialStepSections={recipeStructure.stepSections} readOnly={!canManage} /> : null}
    </div>
  );
}
