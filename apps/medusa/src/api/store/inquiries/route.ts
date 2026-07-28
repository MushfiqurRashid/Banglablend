import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "@medusajs/framework/zod";
import { INQUIRY_MODULE } from "../../../modules/inquiry";
import type InquiryModuleService from "../../../modules/inquiry/service";

const inquirySchema = z.object({
  type: z.enum(["contact", "newsletter", "wholesale", "corporate"]),
  company: z.string().max(160).optional(),
  contactPerson: z.string().max(120).optional(),
  name: z.string().max(120).optional(),
  email: z.email(),
  telephone: z.string().max(30).optional(),
  quantity: z.coerce.number().int().positive().optional(),
  budget: z.string().max(80).optional(),
  occasion: z.string().max(120).optional(),
  deliveryDate: z.string().optional(),
  deliveryLocations: z.string().max(500).optional(),
  packaging: z.string().max(200).optional(),
  messageCard: z.string().max(500).optional(),
  subject: z.string().max(120).optional(),
  message: z.string().max(3000).optional(),
  notes: z.string().max(3000).optional(),
});

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = inquirySchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: "Invalid inquiry.", issues: parsed.error.issues });
  const service = req.scope.resolve<InquiryModuleService>(INQUIRY_MODULE);
  const input = parsed.data;
  const messageNotes = [input.subject ? `Subject: ${input.subject}` : undefined, input.message]
    .filter((value): value is string => Boolean(value))
    .join("\n\n");
  const inquiry = await service.createInquiries({
    type: input.type,
    email: input.email,
    company: input.company,
    contact_person: input.contactPerson ?? input.name,
    telephone: input.telephone,
    quantity: input.quantity,
    budget: input.budget,
    occasion: input.occasion,
    delivery_date: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
    delivery_locations: input.deliveryLocations,
    packaging: input.packaging,
    message_card: input.messageCard,
    notes: input.notes ?? (messageNotes || undefined),
  });
  return res.status(202).json({ inquiry: { id: inquiry.id, status: inquiry.status } });
}
