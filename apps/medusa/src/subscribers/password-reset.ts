import { createHash } from "node:crypto";
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { createEmailAdapter } from "../lib/email/adapter";

interface PasswordResetEvent {
  entity_id: string;
  actor_type: string;
  token: string;
  metadata?: Record<string, unknown>;
}

function storefrontOrigin() {
  return process.env.STOREFRONT_URL ?? process.env.STORE_CORS?.split(",")[0] ?? "";
}

export default async function passwordResetHandler({ event, container }: SubscriberArgs<PasswordResetEvent>) {
  if (event.data.actor_type !== "customer") return;
  const origin = storefrontOrigin();
  if (!origin || !process.env.EMAIL_PROVIDER) {
    container.resolve("logger").error("Customer password reset email is not configured.");
    return;
  }
  const configuredResetUrl = typeof event.data.metadata?.reset_url === "string" ? event.data.metadata.reset_url : `${origin}/account/reset-password`;
  const resetUrl = new URL(configuredResetUrl, origin);
  if (resetUrl.origin !== new URL(origin).origin) throw new Error("Password reset URL must stay on the configured storefront origin.");
  resetUrl.searchParams.set("token", event.data.token);
  const safeUrl = resetUrl.toString().replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const tokenHash = createHash("sha256").update(event.data.token).digest("hex").slice(0, 24);
  await createEmailAdapter().send({
    to: event.data.entity_id,
    subject: "Reset your Bangla Blend password",
    html: `<p>A password reset was requested for your Bangla Blend account.</p><p><a href="${safeUrl}">Choose a new password</a></p><p>This single-use link expires in 15 minutes. If you did not request it, you can ignore this email.</p>`,
    text: `A password reset was requested for your Bangla Blend account. Choose a new password within 15 minutes: ${resetUrl.toString()}\n\nIf you did not request it, ignore this email.`,
    idempotencyKey: `bangla-blend-password-reset-${tokenHash}`
  });
}

export const config: SubscriberConfig = { event: "auth.password_reset" };
