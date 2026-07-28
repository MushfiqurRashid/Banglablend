import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import SslCommerzPaymentProviderService from "./service";

export default ModuleProvider(Modules.PAYMENT, { services: [SslCommerzPaymentProviderService] });
