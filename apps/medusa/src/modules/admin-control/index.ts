import { Module } from "@medusajs/framework/utils";
import AdminControlModuleService from "./service";

export const ADMIN_CONTROL_MODULE = "admin_control";

export default Module(ADMIN_CONTROL_MODULE, {
  service: AdminControlModuleService
});
