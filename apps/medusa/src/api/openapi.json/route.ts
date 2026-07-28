import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { openApiDocument } from "../../lib/openapi";

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.status(200).json(openApiDocument);
}
