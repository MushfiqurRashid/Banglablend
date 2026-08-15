import "server-only";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServiceRoleClient } from "@bangla-blend/supabase-client";

export async function ensureCustomerProfile(user: User) {
  if (!user.email) return "The authenticated account does not have an email address.";

  const admin = createSupabaseServiceRoleClient();
  const { data: linked, error: linkedError } = await admin
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (linkedError) return linkedError.message;
  if (linked) return null;

  const firstName = typeof user.user_metadata?.first_name === "string" ? user.user_metadata.first_name : null;
  const lastName = typeof user.user_metadata?.last_name === "string" ? user.user_metadata.last_name : null;
  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const [fallbackFirstName, ...fallbackLastName] = fullName.split(/\s+/).filter(Boolean);

  const { data: guest, error: guestError } = await admin
    .from("customers")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .is("auth_user_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (guestError) return guestError.message;

  const profile = {
    auth_user_id: user.id,
    email: user.email.toLowerCase(),
    first_name: firstName ?? fallbackFirstName ?? null,
    last_name: lastName ?? (fallbackLastName.length ? fallbackLastName.join(" ") : null),
  };
  const { error } = guest
    ? await admin.from("customers").update(profile).eq("id", guest.id)
    : await admin.from("customers").insert(profile);
  return error?.message ?? null;
}
