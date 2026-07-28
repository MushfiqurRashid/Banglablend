import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "@medusajs/framework/zod";
import { INQUIRY_MODULE } from "../../../../modules/inquiry";
import type InquiryModuleService from "../../../../modules/inquiry/service";
import { MedusaError } from "@medusajs/framework/utils";
import { recordAdminAudit } from "../../../../lib/admin/audit";

const updateSchema = z.object({
  status: z.enum(["new", "acknowledged", "in_progress", "closed"]),
  assigned_staff_id: z.string().trim().max(160).nullable().optional(),
  internal_notes: z.string().trim().max(3000).nullable().optional()
}).strict();
const inquiryIdSchema = z.string().trim().min(1).max(160).regex(/^[A-Za-z0-9_-]+$/);

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid update." });
  const parsedId = inquiryIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid inquiry ID." });
  const id = parsedId.data;
  const service = req.scope.resolve<InquiryModuleService>(INQUIRY_MODULE);
  const before = await service.retrieveInquiry(id).catch(() => {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Inquiry not found.");
  });
  const inquiry = await service.updateInquiries({ id, ...parsed.data });
  await recordAdminAudit(req, {
    action: "inquiry.updated",
    resourceType: "inquiry",
    resourceId: inquiry.id,
    resourceLabel: inquiry.company ?? inquiry.contact_person ?? inquiry.email,
    summary: `Updated ${inquiry.type} inquiry status to ${inquiry.status}.`,
    before,
    after: inquiry
  });
  return res.json({ inquiry });
}

export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsedId = inquiryIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return res.status(400).json({ message: "Invalid inquiry ID." });
  const id = parsedId.data;
  const service = req.scope.resolve<InquiryModuleService>(INQUIRY_MODULE);
  const before = await service.retrieveInquiry(id).catch(() => {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Inquiry not found.");
  });
  await service.deleteInquiries(id);
  await recordAdminAudit(req, {
    action: "inquiry.deleted",
    resourceType: "inquiry",
    resourceId: before.id,
    resourceLabel: before.company ?? before.contact_person ?? before.email,
    summary: `Deleted ${before.type} inquiry for ${before.email}.`,
    before
  });
  return res.json({ id, object: "inquiry", deleted: true });
}
