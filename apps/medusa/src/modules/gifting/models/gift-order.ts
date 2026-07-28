import { model } from "@medusajs/framework/utils";

const GiftOrder = model.define("gift_order", {
  id: model.id().primaryKey(),
  cart_id: model.text().unique(),
  order_id: model.text().nullable(),
  recipient_name: model.text(),
  recipient_telephone: model.text(),
  gift_message: model.text().nullable(),
  hide_prices: model.boolean().default(false),
  packaging_selection: model.text().nullable(),
  preferred_delivery_date: model.dateTime().nullable(),
  delivery_instructions: model.text().nullable(),
  occasion: model.text().nullable(),
  corporate_order_reference: model.text().nullable()
});

export default GiftOrder;
