import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ADMIN_CONTROL_MODULE } from "../../../modules/admin-control";
import type AdminControlModuleService from "../../../modules/admin-control/service";
import { unwrapSettingValue } from "../../../modules/admin-control/value";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<AdminControlModuleService>(ADMIN_CONTROL_MODULE);
  const settings = await service.listAppSettings(
    { is_public: true, is_secret: false },
    { order: { group: "ASC", sort_order: "ASC", key: "ASC" }, take: 500 }
  );
  return res.json({
    settings: settings.map((setting) => ({
      key: setting.key,
      group: setting.group,
      label: setting.label,
      value: unwrapSettingValue(setting.value),
      value_type: setting.value_type,
      updated_at: setting.updated_at
    }))
  });
}
