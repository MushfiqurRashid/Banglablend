import "server-only";
import type { getSupabaseForRequest } from "@/lib/auth";
import type { ContentTypeDef } from "@/lib/content-registry";

export async function loadForeignOptions(supabase: Awaited<ReturnType<typeof getSupabaseForRequest>>, contentType: ContentTypeDef) {
  const result: Record<string, Array<{ id: string; label: string }>> = {};
  for (const field of contentType.fields) {
    if (field.kind !== "foreignKey" || !field.foreignTable || !field.foreignLabelColumn) continue;
    // Plain string concatenation, not a template literal: postgrest-js statically parses
    // .select()'s argument at the type level when it's a literal type, and a dynamic
    // foreignLabelColumn collapses that parse into an unhelpful ParserError type.
    const selectColumns: string = "id, " + field.foreignLabelColumn;
    const { data } = await supabase.from(field.foreignTable).select(selectColumns).limit(500);
    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
    result[field.name] = rows.map((row) => ({ id: String(row.id), label: String(row[field.foreignLabelColumn!] ?? "") }));
  }
  return result;
}
