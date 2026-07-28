import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "@medusajs/framework/zod";
import { ADMIN_CONTROL_MODULE } from "../../../../modules/admin-control";
import type AdminControlModuleService from "../../../../modules/admin-control/service";

const querySchema = z.object({
  resource_type: z.string().trim().max(100).optional(),
  action: z.string().trim().max(120).optional(),
  actor_id: z.string().trim().max(160).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0)
});

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: "Invalid audit filters." });

  const service = req.scope.resolve<AdminControlModuleService>(ADMIN_CONTROL_MODULE);
  const filters = {
    ...(parsed.data.resource_type ? { resource_type: parsed.data.resource_type } : {}),
    ...(parsed.data.action ? { action: parsed.data.action } : {}),
    ...(parsed.data.actor_id ? { actor_id: parsed.data.actor_id } : {})
  };
  const [auditLogs, count] = await service.listAndCountAdminAuditLogs(filters, {
    order: { created_at: "DESC" },
    skip: parsed.data.offset,
    take: parsed.data.limit
  });

  return res.json({
    audit_logs: auditLogs,
    count,
    offset: parsed.data.offset,
    limit: parsed.data.limit,
    immutable: true
  });
}
