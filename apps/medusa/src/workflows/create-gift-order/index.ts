import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createGiftOrderStep, type CreateGiftOrderInput } from "./steps/create-gift-order";

export const createGiftOrderWorkflow = createWorkflow("create-gift-order", (input: CreateGiftOrderInput) => new WorkflowResponse(createGiftOrderStep(input)));
