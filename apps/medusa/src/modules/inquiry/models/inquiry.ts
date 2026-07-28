import { model } from "@medusajs/framework/utils";

const Inquiry = model.define("inquiry", {
  id: model.id().primaryKey(),
  type: model.enum(["contact", "newsletter", "wholesale", "corporate"]),
  status: model.enum(["new", "acknowledged", "in_progress", "closed"]).default("new"),
  company: model.text().nullable(),
  contact_person: model.text().nullable(),
  email: model.text(),
  telephone: model.text().nullable(),
  quantity: model.number().nullable(),
  budget: model.text().nullable(),
  occasion: model.text().nullable(),
  delivery_date: model.dateTime().nullable(),
  delivery_locations: model.text().nullable(),
  packaging: model.text().nullable(),
  message_card: model.text().nullable(),
  notes: model.text().nullable(),
  assigned_staff_id: model.text().nullable(),
  internal_notes: model.text().nullable()
});

export default Inquiry;
