import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const generatedAssets = {
  "bangla-blend.css": {
    contentType: "text/css; charset=utf-8",
    body: `:root { color-scheme: light; }
body { margin: 0; background: #f6efe4; }
.topbar { display: none; }
.swagger-ui .info .title, .swagger-ui .opblock-tag { font-family: Georgia, serif; color: #2a211d; }
.swagger-ui .info { margin: 42px 0 28px; }
.swagger-ui .info .title small { background: #8e2d1f; }
.swagger-ui .btn.authorize { color: #3e6b3f; border-color: #3e6b3f; }
.swagger-ui .scheme-container { background: #fbf8f2; box-shadow: none; border-block: 1px solid #ded1c2; }
.swagger-ui .opblock.opblock-post { border-color: #b65a3c; background: rgb(182 90 60 / 8%); }
.swagger-ui .opblock.opblock-get { border-color: #3e6b3f; background: rgb(62 107 63 / 8%); }
`
  },
  "swagger-initializer.js": {
    contentType: "application/javascript; charset=utf-8",
    body: `window.ui = SwaggerUIBundle({
  url: "/openapi.json",
  dom_id: "#swagger-ui",
  deepLinking: true,
  displayRequestDuration: true,
  persistAuthorization: true,
  filter: true,
  tryItOutEnabled: true,
  presets: [SwaggerUIBundle.presets.apis]
});
`
  }
} as const;

const packageAssets = {
  "swagger-ui.css": "text/css; charset=utf-8",
  "swagger-ui-bundle.js": "application/javascript; charset=utf-8"
} as const;

type GeneratedAsset = keyof typeof generatedAssets;
type PackageAsset = keyof typeof packageAssets;

function isGeneratedAsset(asset: string): asset is GeneratedAsset {
  return Object.hasOwn(generatedAssets, asset);
}

function isPackageAsset(asset: string): asset is PackageAsset {
  return Object.hasOwn(packageAssets, asset);
}

async function readPackageAsset(asset: PackageAsset) {
  const candidates = [
    path.join(process.cwd(), "node_modules", "swagger-ui-dist", asset),
    path.join(process.cwd(), "apps", "medusa", "node_modules", "swagger-ui-dist", asset)
  ];

  for (const candidate of candidates) {
    try {
      return await readFile(candidate);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
        throw error;
      }
    }
  }

  throw new Error(`Unable to locate the installed Swagger UI asset: ${asset}`);
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const asset = req.params.asset;

  if (!asset) {
    return res.status(404).json({ message: "Swagger asset not found." });
  }

  if (isGeneratedAsset(asset)) {
    const generated = generatedAssets[asset];
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", generated.contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(generated.body);
  }

  if (!isPackageAsset(asset)) {
    return res.status(404).json({ message: "Swagger asset not found." });
  }

  const body = await readPackageAsset(asset);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Content-Type", packageAssets[asset]);
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(200).send(body);
}
