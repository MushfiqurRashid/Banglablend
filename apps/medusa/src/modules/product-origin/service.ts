import { MedusaService } from "@medusajs/framework/utils";
import ProductOrigin from "./models/product-origin";

class ProductOriginModuleService extends MedusaService({ ProductOrigin }) {}
export default ProductOriginModuleService;
