import { MedusaService } from "@medusajs/framework/utils";
import ProductMarket from "./models/product-market";

class ProductMarketModuleService extends MedusaService({ ProductMarket }) {}
export default ProductMarketModuleService;
