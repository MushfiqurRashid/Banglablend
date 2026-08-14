import "server-only";

// Supabase emails this URL to staff for invitations and password resets, so it has to be the real
// public Admin URL. Falling back to localhost in production would send a recipient to a machine
// they don't have and silently break onboarding, so only development is allowed to fall back.
export function adminAuthCallbackUrl(next: string) {
  const configured = process.env.NEXT_PUBLIC_ADMIN_URL?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_ADMIN_URL must be set: staff invitation and password-reset links are emailed from it.");
    }
    return `http://localhost:3100/auth/callback?next=${next}`;
  }
  return `${configured.replace(/\/+$/, "")}/auth/callback?next=${next}`;
}
