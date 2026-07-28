import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import { recordAdminAudit } from "../../../../lib/admin/audit";
import { ADMIN_CONTROL_MODULE } from "../../../../modules/admin-control";
import type AdminControlModuleService from "../../../../modules/admin-control/service";
import {
  presentSetting,
  redactSettingForAudit,
  settingValueError,
  wrapSettingValue
} from "../../../../modules/admin-control/value";

const listSchema = z.object({
  group: z.string().trim().max(80).optional(),
  q: z.string().trim().max(120).optional()
});

const createSchema = z.object({
  key: z.string().trim().min(3).max(160).regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/),
  group: z.string().trim().min(2).max(80).default("general"),
  label: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).nullable().optional(),
  value: z.unknown(),
  value_type: z.enum(["string", "number", "boolean", "json"]).default("string"),
  is_public: z.boolean().default(false),
  is_secret: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(10000).default(0),
  metadata: z.record(z.string(), z.unknown()).nullable().optional()
}).strict();

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: "Invalid settings filters." });

  const service = req.scope.resolve<AdminControlModuleService>(ADMIN_CONTROL_MODULE);
  const filters: Record<string, unknown> = {};
  if (parsed.data.group) filters.group = parsed.data.group;
  if (parsed.data.q) filters.q = parsed.data.q;
  const [settings, count] = await service.listAndCountAppSettings(filters, {
    order: { group: "ASC", sort_order: "ASC", key: "ASC" },
    take: 500
  });
  return res.json({ settings: settings.map(presentSetting), count });
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid setting.", errors: parsed.error.flatten() });
  }

  const service = req.scope.resolve<AdminControlModuleService>(ADMIN_CONTROL_MODULE);
  const [existing] = await service.listAppSettings({ key: parsed.data.key });
  if (existing) {
    throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, `Setting "${parsed.data.key}" already exists.`);
  }
  if (parsed.data.is_secret && parsed.data.is_public) {
    return res.status(400).json({ message: "A secret setting cannot be public." });
  }
  const valueError = settingValueError(parsed.data.value, parsed.data.value_type);
  if (valueError) {
    return res.status(400).json({ message: valueError });
  }

  const setting = await service.createAppSettings({
    ...parsed.data,
    value: wrapSettingValue(parsed.data.value),
    description: parsed.data.description ?? null,
    metadata: parsed.data.metadata ?? null,
    updated_by: req.auth_context.actor_id
  });
  await recordAdminAudit(req, {
    action: "settings.created",
    resourceType: "app_setting",
    resourceId: setting.id,
    resourceLabel: setting.label,
    summary: `Created application setting ${setting.key}.`,
    after: redactSettingForAudit(setting)
  });
  return res.status(201).json({ setting: presentSetting(setting) });
}
