import { MedusaService } from "@medusajs/framework/utils";
import AdminAuditLog from "./models/admin-audit-log";
import AppSetting from "./models/app-setting";

class AdminControlModuleService extends MedusaService({
  AdminAuditLog,
  AppSetting
}) {}

export default AdminControlModuleService;
