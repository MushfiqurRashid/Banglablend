import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@bangla-blend/supabase-client";

// Memoized per request. Every call to createSupabaseServerClient builds a fresh GoTrueClient, and
// auth-js only serializes token refreshes *within* one instance -- so a layout and its pages each
// constructing their own raced to refresh the same rotated token and the server rejected them with
// "Too many concurrent token refresh requests on the same session or refresh token".
export const getSupabaseForRequest = cache(async () => {
  return createSupabaseServerClient(await cookies(), { cookieName: "banglablend-admin-auth" });
});

export interface StaffSession {
  id: string;
  authUserId: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  role: {
    id: string;
    key: string;
    name: string;
    permissions: string[];
  };
}

interface StaffRow {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role: { id: string; key: string; name: string; permissions: string[] } | { id: string; key: string; name: string; permissions: string[] }[] | null;
}

// Memoized for the same reason as getSupabaseForRequest, and because the dashboard resolves the
// session from the layout, the page, and every server action on the same request.
export const getStaffSession = cache(async (): Promise<StaffSession | null> => {
  const supabase = await getSupabaseForRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("staff_members")
    .select("id, email, full_name, is_active, role:staff_roles ( id, key, name, permissions )")
    .eq("id", user.id)
    .returns<StaffRow[]>()
    .maybeSingle();
  if (!data || !data.is_active) return null;
  const role = Array.isArray(data.role) ? data.role[0] : data.role;
  if (!role) return null;

  return {
    id: data.id,
    authUserId: user.id,
    email: data.email,
    fullName: data.full_name,
    isActive: data.is_active,
    role,
  };
});

export function hasPermission(session: StaffSession | null, resource: string, action: string) {
  if (!session) return false;
  return session.role.permissions.some(
    (permission) => permission === "*:*" || permission === `${resource}:*` || permission === `${resource}:${action}`,
  );
}

export async function requireStaffPermission(resource: string, action: string) {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (!hasPermission(session, resource, action)) redirect("/?access=denied");
  return session;
}
