import { model } from "@medusajs/framework/utils";

const ProductOrigin = model.define("product_origin", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(),
  division: model.text().nullable(),
  district: model.text().nullable(),
  locality: model.text().nullable(),
  producer_reference: model.text().nullable(),
  harvest_date: model.dateTime().nullable(),
  batch_number: model.text().nullable(),
  latitude: model.bigNumber().nullable(),
  longitude: model.bigNumber().nullable(),
  verification_status: model.enum(["draft", "in_review", "verified", "rejected"]).default("draft"),
  evidence_reference: model.text().nullable()
});

export default ProductOrigin;
