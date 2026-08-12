import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceRoleClient } from "@bangla-blend/supabase-client";
import type { StaffSession } from "./auth";

// Every admin mutation records an entry here (see docs/superadmin.md's "append-only record of
// important administrative changes" requirement). admin_audit_log itself blocks UPDATE/DELETE at
// the database level (see supabase/migrations/..._payments.sql's forbid_mutation trigger, reused
// for this table in ..._operations_modules.sql), so this is insert-only by construction.
export async function recordAudit(
  _requestClient: SupabaseClient,
  session: StaffSession,
  input: {
    action: string;
    resourceType: string;
    resourceId?: string;
    resourceLabel?: string;
    summary: string;
    before?: unknown;
    after?: unknown;
  },
) {
  // The audit table intentionally has no INSERT policy for staff sessions. Keep the writer on the
  // server-only service client so browser credentials can never forge actor or before/after data.
  const auditClient = createSupabaseServiceRoleClient();
  const { error } = await auditClient.from("admin_audit_log").insert({
    actor_id: session.id,
    actor_email: session.email,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    resource_label: input.resourceLabel ?? null,
    summary: input.summary,
    before: input.before ?? null,
    after: input.after ?? null,
  });
  if (error) throw new Error(`The change was saved, but its audit record failed: ${error.message}`);
}
