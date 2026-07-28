import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { GIFTING_MODULE } from "../../../modules/gifting";
import type GiftingModuleService from "../../../modules/gifting/service";

export interface CreateGiftOrderInput { cart_id: string; recipient_name: string; recipient_telephone: string; gift_message?: string; hide_prices?: boolean; packaging_selection?: string; preferred_delivery_date?: Date; delivery_instructions?: string; occasion?: string; }

export const createGiftOrderStep = createStep("create-gift-order-record", async (input: CreateGiftOrderInput, { container }) => {
  const service = container.resolve<GiftingModuleService>(GIFTING_MODULE);
  const gift = await service.createGiftOrders(input);
  return new StepResponse(gift, gift.id);
}, async (id: string | undefined, { container }) => { if (id) await container.resolve<GiftingModuleService>(GIFTING_MODULE).deleteGiftOrders(id); });
