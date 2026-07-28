import { Module } from "@medusajs/framework/utils";
import GiftingModuleService from "./service";

export const GIFTING_MODULE = "gifting";
export default Module(GIFTING_MODULE, { service: GiftingModuleService });
