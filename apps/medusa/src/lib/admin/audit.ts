import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ADMIN_CONTROL_MODULE } from "../../modules/admin-control";
import type AdminControlModuleService from "../../modules/admin-control/service";

interface AuditInput {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  resourceLabel?: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown> | null;
}

function toAuditJson(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;

  let serialized: unknown;
  try {
    const json = JSON.stringify(value);
    if (json === undefined) {
      return { serialization_error: "Value was not JSON serializable." };
    }
    serialized = JSON.parse(json) as unknown;
  } catch {
    return { serialization_error: "Value was not JSON serializable." };
  }

  if (serialized && typeof serialized === "object" && !Array.isArray(serialized)) {
    return serialized as Record<string, unknown>;
  }
  return { value: serialized };
}

function safeActorEmail(req: AuthenticatedMedusaRequest) {
  const email = req.auth_context.user_metadata?.email;
  return typeof email === "string" ? email : null;
}

export async function recordAdminAudit(req: AuthenticatedMedusaRequest, input: AuditInput) {
  const service = req.scope.resolve<AdminControlModuleService>(ADMIN_CONTROL_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  try {
    await service.createAdminAuditLogs({
      actor_id: req.auth_context.actor_id,
      actor_email: safeActorEmail(req),
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      resource_label: input.resourceLabel ?? null,
      summary: input.summary,
      before: toAuditJson(input.before),
      after: toAuditJson(input.after),
      request_id: req.requestId ?? null,
      metadata: toAuditJson(input.metadata)
    });
  } catch (error) {
    logger.error(
      `Failed to record admin audit ${input.action} for ${input.resourceType}:${input.resourceId ?? "unknown"}`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
