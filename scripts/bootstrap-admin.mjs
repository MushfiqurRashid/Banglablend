/* global console, process */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const fullName = process.env.SUPERADMIN_FULL_NAME?.trim() || null;
let bootstrapPassword = process.env.SUPERADMIN_BOOTSTRAP_PASSWORD;
const generatePassword = process.argv.includes("--generate-password");
const credentialFile = process.env.SUPERADMIN_CREDENTIAL_FILE;
const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3100";

if (generatePassword && !bootstrapPassword) {
  bootstrapPassword = `${randomBytes(24).toString("base64url")}Aa1!`;
}

if (!url || !serviceRoleKey || !email) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPERADMIN_EMAIL are required.");
}
if (process.env.NODE_ENV === "production" && !adminUrl.startsWith("https://")) {
  throw new Error("NEXT_PUBLIC_ADMIN_URL must use HTTPS in production.");
}
if (bootstrapPassword && bootstrapPassword.length < 12) {
  throw new Error("SUPERADMIN_BOOTSTRAP_PASSWORD must contain at least 12 characters when provided.");
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: role, error: roleError } = await supabase.from("staff_roles").select("id").eq("key", "super_admin").single();
if (roleError || !role) throw new Error(roleError?.message ?? "The Super Admin role is missing. Apply database migrations first.");

let authUser = null;
for (let page = 1; page <= 20 && !authUser; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  authUser = data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
  if (data.users.length < 100) break;
}

let createdUser = false;
if (!authUser) {
  const result = bootstrapPassword
    ? await supabase.auth.admin.createUser({ email, password: bootstrapPassword, email_confirm: true, user_metadata: { full_name: fullName } })
    : await supabase.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
        redirectTo: `${adminUrl}/auth/callback?next=/set-password`,
      });
  if (result.error || !result.data.user) throw new Error(result.error?.message ?? "The Supabase Auth user could not be created.");
  authUser = result.data.user;
  createdUser = true;
} else if (bootstrapPassword) {
  const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
    password: bootstrapPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) throw new Error(error?.message ?? "The existing Supabase Auth user could not be updated.");
  authUser = data.user;
}

const { error: staffError } = await supabase.from("staff_members").upsert({
  id: authUser.id,
  email,
  full_name: fullName,
  role_id: role.id,
  is_active: true,
});
if (staffError) {
  if (createdUser) await supabase.auth.admin.deleteUser(authUser.id);
  throw new Error(staffError.message);
}

if (credentialFile && bootstrapPassword) {
  await writeFile(
    credentialFile,
    `SUPERADMIN_EMAIL=${email}\nSUPERADMIN_BOOTSTRAP_PASSWORD=${bootstrapPassword}\n`,
    { mode: 0o600 },
  );
}

console.log(
  `${createdUser ? "Created" : "Updated"} Super Admin access for ${email}. ${
    bootstrapPassword ? "Password bootstrap used." : "Invitation email requested."
  }${credentialFile && bootstrapPassword ? ` Credentials saved to ${credentialFile}.` : ""}`,
);
