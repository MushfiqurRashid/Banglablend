import { Module } from "@medusajs/framework/utils";
import ProductOriginModuleService from "./service";

export const PRODUCT_ORIGIN_MODULE = "product_origin";
export default Module(PRODUCT_ORIGIN_MODULE, { service: ProductOriginModuleService });
