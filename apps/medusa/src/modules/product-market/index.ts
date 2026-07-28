import { Module } from "@medusajs/framework/utils";
import ProductMarketModuleService from "./service";

export const PRODUCT_MARKET_MODULE = "product_market";
export default Module(PRODUCT_MARKET_MODULE, { service: ProductMarketModuleService });
