import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { GET as getSwaggerAsset } from "../../apps/medusa/src/api/docs/[asset]/route";
import { GET as getSwaggerUi } from "../../apps/medusa/src/api/docs/route";
import { openApiDocument } from "../../apps/medusa/src/lib/openapi";

type MockResponse = {
  setHeader: (name: string, value: string) => MockResponse;
  status: (code: number) => MockResponse;
  type: (value: string) => MockResponse;
  send: (value: unknown) => MockResponse;
  json: (value: unknown) => MockResponse;
};

function createResponse() {
  const state: {
    status: number;
    headers: Record<string, string>;
    body?: unknown;
  } = { status: 200, headers: {} };

  const response: MockResponse = {
    setHeader(name, value) {
      state.headers[name.toLowerCase()] = value;
      return response;
    },
    status(code) {
      state.status = code;
      return response;
    },
    type(value) {
      state.headers["content-type"] = value;
      return response;
    },
    send(value) {
      state.body = value;
      return response;
    },
    json(value) {
      state.headers["content-type"] = "application/json";
      state.body = value;
      return response;
    },
  };

  return { response, state };
}

const documentedOperations = {
  "/docs": ["get"],
  "/openapi.json": ["get"],
  "/store/app-settings": ["get"],
  "/store/inquiries": ["post"],
  "/admin/inquiries": ["get", "post"],
  "/admin/inquiries/{id}": ["post", "delete"],
  "/admin/gift-orders/{orderId}": ["get", "post", "delete"],
  "/admin/payment-audits": ["get"],
  "/admin/content/workspace": ["get"],
  "/admin/superadmin/overview": ["get"],
  "/admin/superadmin/catalog": ["get", "post"],
  "/admin/superadmin/catalog/{id}": ["get", "post", "delete"],
  "/admin/superadmin/catalogs": ["get", "post"],
  "/admin/superadmin/catalogs/{id}": ["post", "delete"],
  "/admin/superadmin/orders/{id}/workflow": ["get", "post"],
  "/admin/superadmin/settings": ["get", "post"],
  "/admin/superadmin/settings/{id}": ["get", "post", "delete"],
  "/admin/superadmin/audit-logs": ["get"],
  "/webhooks/sslcommerz/ipn": ["post"],
  "/webhooks/sslcommerz/success": ["post"],
  "/webhooks/sslcommerz/fail": ["post"],
  "/webhooks/sslcommerz/cancel": ["post"],
} as const;

  describe("Bangla Blend OpenAPI", () => {
    it("requires initial stock for guided catalog variants", () => {
      const variantSchema = openApiDocument.components.schemas.CreateCatalogVariant as {
        required?: string[];
        properties?: Record<string, unknown>;
      };

      expect(variantSchema.required).toContain("stock_quantity");
      expect(variantSchema.properties).toHaveProperty("stock_quantity");
    });

    it("documents every custom Medusa operation with a unique operation ID", () => {
    expect(openApiDocument.openapi).toBe("3.1.0");
    const paths = openApiDocument.paths as Record<
      string,
      Record<string, { operationId?: string; responses?: unknown; security?: unknown }>
    >;
    const operationIds: string[] = [];

    for (const [path, methods] of Object.entries(documentedOperations)) {
      expect(paths[path], `${path} is missing`).toBeDefined();
      for (const method of methods) {
        const operation = paths[path]?.[method];
        expect(operation, `${method.toUpperCase()} ${path} is missing`).toBeDefined();
        expect(operation?.operationId).toBeTruthy();
        expect(operation?.responses).toBeTruthy();
        operationIds.push(operation?.operationId ?? "");

        if (path.startsWith("/admin/")) {
          expect(operation?.security).toEqual([{ adminBearer: [] }, { adminApiKey: [] }]);
        }
      }
    }

    expect(new Set(operationIds).size).toBe(operationIds.length);
  });

  it("renders a self-hosted Swagger page with a strict content policy", async () => {
    const { response, state } = createResponse();
    await getSwaggerUi({} as never, response as never);

    expect(state.status).toBe(200);
    expect(state.body).toContain("/docs/swagger-ui.css");
    expect(state.body).toContain("/docs/swagger-ui-bundle.js");
    expect(state.body).not.toContain("cdn.jsdelivr.net");
    expect(state.headers["content-security-policy"]).toContain("script-src 'self'");
  });

  it("serves Swagger assets locally and rejects unknown assets", async () => {
    const css = createResponse();
    await getSwaggerAsset({ params: { asset: "swagger-ui.css" } } as never, css.response as never);

    expect(css.state.status).toBe(200);
    expect(css.state.headers["content-type"]).toBe("text/css; charset=utf-8");
    expect(Buffer.isBuffer(css.state.body)).toBe(true);
    expect((css.state.body as Buffer).byteLength).toBeGreaterThan(100_000);

    const missing = createResponse();
    await getSwaggerAsset(
      { params: { asset: "not-allowed.js" } } as never,
      missing.response as never,
    );
    expect(missing.state.status).toBe(404);
  });
});
