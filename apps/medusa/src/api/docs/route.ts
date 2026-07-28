import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const swaggerHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bangla Blend API · Swagger</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      :root { color-scheme: light; }
      body { margin: 0; background: #f6efe4; }
      .topbar { display: none; }
      .swagger-ui .info .title, .swagger-ui .opblock-tag { font-family: Georgia, serif; color: #2a211d; }
      .swagger-ui .info { margin: 42px 0 28px; }
      .swagger-ui .info .title small { background: #8e2d1f; }
      .swagger-ui .btn.authorize { color: #3e6b3f; border-color: #3e6b3f; }
      .swagger-ui .scheme-container { background: #fbf8f2; box-shadow: none; border-block: 1px solid #ded1c2; }
      .swagger-ui .opblock.opblock-post { border-color: #b65a3c; background: rgb(182 90 60 / 8%); }
      .swagger-ui .opblock.opblock-get { border-color: #3e6b3f; background: rgb(62 107 63 / 8%); }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayRequestDuration: true,
        persistAuthorization: true,
        filter: true,
        tryItOutEnabled: true,
        presets: [SwaggerUIBundle.presets.apis]
      });
    </script>
  </body>
</html>`;

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self'");
  return res.status(200).type("html").send(swaggerHtml);
}
