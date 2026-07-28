import { MedusaService } from "@medusajs/framework/utils";
import GiftOrder from "./models/gift-order";

class GiftingModuleService extends MedusaService({ GiftOrder }) {}
export default GiftingModuleService;
