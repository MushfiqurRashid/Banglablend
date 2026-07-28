import { model } from "@medusajs/framework/utils";

const ProductMarket = model.define("product_market", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(),
  bangladesh_available: model.boolean().default(true),
  international_available: model.boolean().default(false),
  supported_countries: model.array().default([]),
  restricted_countries: model.array().default([]),
  export_ready: model.boolean().default(false),
  domestic_only: model.boolean().default(false),
  shipping_classification: model.text().nullable(),
  customs_description: model.text().nullable(),
  country_of_origin: model.text().nullable(),
  package_dimensions: model.json().nullable(),
  storage_requirements: model.text().nullable(),
  temperature_requirements: model.text().nullable(),
  shelf_life_days: model.number().nullable(),
  minimum_shelf_life_at_dispatch_days: model.number().nullable(),
  verified: model.boolean().default(false)
});

export default ProductMarket;
