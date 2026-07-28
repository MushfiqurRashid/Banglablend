import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import { recordAdminAudit } from "../../../../../lib/admin/audit";
import { ADMIN_CONTROL_MODULE } from "../../../../../modules/admin-control";
import type AdminControlModuleService from "../../../../../modules/admin-control/service";
import {
  presentSetting,
  redactSettingForAudit,
  settingValueError,
  unwrapSettingValue,
  wrapSettingValue
} from "../../../../../modules/admin-control/value";

const updateSchema = z.object({
  group: z.string().trim().min(2).max(80).optional(),
  label: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  value: z.unknown().optional(),
  value_type: z.enum(["string", "number", "boolean", "json"]).optional(),
  is_public: z.boolean().optional(),
  is_secret: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional()
}).strict();
const settingIdSchema = z.string().trim().min(1).max(160).regex(/^[A-Za-z0-9_-]+$/);

async function retrieve(service: AdminControlModuleService, id: string) {
  try {
    return await service.retrieveAppSetting(id);
  } catch {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Setting not found.");
  }
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<AdminControlModuleService>(ADMIN_CONTROL_MODULE);
  const parsedId = settingIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid setting ID." });
  const id = parsedId.data;
  const setting = await retrieve(service, id);
  return res.json({ setting: presentSetting(setting) });
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid setting update.", errors: parsed.error.flatten() });
  }

  const service = req.scope.resolve<AdminControlModuleService>(ADMIN_CONTROL_MODULE);
  const parsedId = settingIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid setting ID." });
  const id = parsedId.data;
  const before = await retrieve(service, id);
  const nextSecret = parsed.data.is_secret ?? before.is_secret;
  const nextPublic = parsed.data.is_public ?? before.is_public;
  if (nextSecret && nextPublic) {
    return res.status(400).json({ message: "A secret setting cannot be public." });
  }

  const { value, ...fields } = parsed.data;
  const nextValue = value !== undefined ? value : unwrapSettingValue(before.value);
  const valueError = settingValueError(
    nextValue,
    parsed.data.value_type ?? before.value_type
  );
  if (valueError) {
    return res.status(400).json({ message: valueError });
  }
  const update = {
    id: before.id,
    ...fields,
    ...(value !== undefined ? { value: wrapSettingValue(value) } : {}),
    updated_by: req.auth_context.actor_id
  };
  const setting = await service.updateAppSettings(update);
  await recordAdminAudit(req, {
    action: "settings.updated",
    resourceType: "app_setting",
    resourceId: setting.id,
    resourceLabel: setting.label,
    summary: `Updated application setting ${setting.key}.`,
    before: redactSettingForAudit(before, before.is_secret || setting.is_secret),
    after: redactSettingForAudit(setting, before.is_secret || setting.is_secret)
  });
  return res.json({ setting: presentSetting(setting) });
}

export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<AdminControlModuleService>(ADMIN_CONTROL_MODULE);
  const parsedId = settingIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid setting ID." });
  const id = parsedId.data;
  const before = await retrieve(service, id);
  await service.deleteAppSettings(before.id);
  await recordAdminAudit(req, {
    action: "settings.deleted",
    resourceType: "app_setting",
    resourceId: before.id,
    resourceLabel: before.label,
    summary: `Deleted application setting ${before.key}.`,
    before: redactSettingForAudit(before)
  });
  return res.json({ id: before.id, object: "app_setting", deleted: true });
}
