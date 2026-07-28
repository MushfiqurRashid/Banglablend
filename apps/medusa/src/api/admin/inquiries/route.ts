import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { INQUIRY_MODULE } from "../../../modules/inquiry";
import type InquiryModuleService from "../../../modules/inquiry/service";
import { z } from "@medusajs/framework/zod";
import { recordAdminAudit } from "../../../lib/admin/audit";

const createSchema = z.object({
  type: z.enum(["contact", "newsletter", "wholesale", "corporate"]),
  company: z.string().trim().max(160).nullable().optional(),
  contact_person: z.string().trim().max(120).nullable().optional(),
  email: z.email(),
  telephone: z.string().trim().max(30).nullable().optional(),
  quantity: z.number().int().positive().nullable().optional(),
  budget: z.string().trim().max(80).nullable().optional(),
  occasion: z.string().trim().max(120).nullable().optional(),
  delivery_date: z.string().datetime().nullable().optional(),
  delivery_locations: z.string().trim().max(500).nullable().optional(),
  packaging: z.string().trim().max(200).nullable().optional(),
  message_card: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(3000).nullable().optional(),
  assigned_staff_id: z.string().trim().max(160).nullable().optional(),
  internal_notes: z.string().trim().max(3000).nullable().optional()
}).strict();

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<InquiryModuleService>(INQUIRY_MODULE);
  const [inquiries, count] = await service.listAndCountInquiries({}, { order: { created_at: "DESC" }, take: 100 });
  return res.json({ inquiries, count });
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid inquiry.", errors: parsed.error.flatten() });
  }
  const service = req.scope.resolve<InquiryModuleService>(INQUIRY_MODULE);
  const inquiry = await service.createInquiries({
    ...parsed.data,
    delivery_date: parsed.data.delivery_date ? new Date(parsed.data.delivery_date) : null
  });
  await recordAdminAudit(req, {
    action: "inquiry.created",
    resourceType: "inquiry",
    resourceId: inquiry.id,
    resourceLabel: inquiry.company ?? inquiry.contact_person ?? inquiry.email,
    summary: `Created ${inquiry.type} inquiry for ${inquiry.email}.`,
    after: inquiry
  });
  return res.status(201).json({ inquiry });
}
