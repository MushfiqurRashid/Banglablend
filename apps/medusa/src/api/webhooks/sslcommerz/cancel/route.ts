import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
export async function POST(req: MedusaRequest, res: MedusaResponse) { return res.redirect(303, `${process.env.STOREFRONT_URL ?? "http://localhost:3000"}/checkout/failed?reason=cancelled`); }
