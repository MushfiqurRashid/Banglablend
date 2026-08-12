"use server";

import { revalidatePath } from "next/cache";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export interface CustomerActionState {
  error?: string;
}

export async function updateCustomerTagsAction(
  customerId: string,
  _prevState: CustomerActionState | undefined,
  formData: FormData,
): Promise<CustomerActionState> {
  const session = await getStaffSession();
  if (!session || !hasPermission(session, "customers", "manage")) return { error: "You do not have permission to manage customers." };

  const rawTags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const tags = rawTags.filter((tag, index) => rawTags.findIndex((candidate) => candidate.toLocaleLowerCase() === tag.toLocaleLowerCase()) === index);
  if (tags.length > 20) return { error: "Use no more than 20 customer tags." };
  if (tags.some((tag) => tag.length > 50)) return { error: "Each customer tag must be 50 characters or fewer." };

  const supabase = await getSupabaseForRequest();
  const { data: before, error: readError } = await supabase.from("customers").select("email, tags").eq("id", customerId).maybeSingle();
  if (readError) return { error: readError.message };
  if (!before) return { error: "This customer no longer exists." };
  const { data: customer, error } = await supabase.from("customers").update({ tags }).eq("id", customerId).select("email").maybeSingle();
  if (error || !customer) return { error: error?.message ?? "The customer tags could not be updated." };

  await recordAudit(supabase, session, {
    action: "customers.tags.updated",
    resourceType: "customer",
    resourceId: customerId,
    resourceLabel: customer?.email,
    summary: `Set tags to: ${tags.join(", ") || "(none)"}.`,
    before: { tags: before.tags },
    after: { tags },
  });

  revalidatePath("/customers");
  revalidatePath("/customers/tags");
  revalidatePath(`/customers/${customerId}`);
  return {};
}
