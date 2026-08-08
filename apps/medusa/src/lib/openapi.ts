type OpenApiSchema = Record<string, unknown>;

const jsonResponse = (description: string, schema?: OpenApiSchema) => ({
  description,
  ...(schema
    ? {
        content: {
          "application/json": { schema },
        },
      }
    : {}),
});

const requestBody = (schema: OpenApiSchema, contentType = "application/json") => ({
  required: true,
  content: {
    [contentType]: { schema },
  },
});

const errorResponse = jsonResponse("Request failed", {
  $ref: "#/components/schemas/Error",
});

const adminSecurity = [{ adminBearer: [] }, { adminApiKey: [] }];
const superAdminDescription =
  "Requires an authenticated Medusa administrator with the matching Super Admin RBAC permission.";

const idParameter = (name: string, description: string) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: {
    type: "string",
    minLength: 1,
    maxLength: 160,
    pattern: "^[A-Za-z0-9_-]+$",
  },
});

const paginationParameters = [
  {
    name: "limit",
    in: "query",
    description: "Maximum number of records to return.",
    schema: { type: "integer", minimum: 1, maximum: 200, default: 100 },
  },
  {
    name: "offset",
    in: "query",
    description: "Number of records to skip.",
    schema: { type: "integer", minimum: 0, default: 0 },
  },
];

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Bangla Blend API",
    version: "0.3.0",
    description:
      "Interactive contract for Bangla Blend's custom Medusa store, administration, catalog, gifting, inquiry, application settings, payment audit, and SSLCOMMERZ webhook endpoints. Standard commerce resources are provided by Medusa and intentionally remain in Medusa's official API reference.",
  },
  servers: [
    { url: "/", description: "The Medusa backend serving this document" },
    { url: "http://localhost:9000", description: "Local Medusa backend" },
  ],
  tags: [
    { name: "Documentation", description: "OpenAPI contract and interactive documentation" },
    { name: "Store", description: "Public storefront operations" },
    { name: "Admin", description: "Authenticated operational endpoints" },
    { name: "Super Admin", description: "RBAC-protected catalog and platform controls" },
    { name: "Payments", description: "SSLCOMMERZ callback endpoints" },
  ],
  paths: {
    "/docs": {
      get: {
        tags: ["Documentation"],
        summary: "Open Swagger UI",
        operationId: "getSwaggerUi",
        responses: {
          "200": {
            description: "Self-hosted Swagger UI",
            content: { "text/html": { schema: { type: "string" } } },
          },
        },
      },
    },
    "/openapi.json": {
      get: {
        tags: ["Documentation"],
        summary: "Download the OpenAPI document",
        operationId: "getOpenApiDocument",
        responses: {
          "200": jsonResponse("OpenAPI 3.1 document", { type: "object" }),
        },
      },
    },
    "/store/app-settings": {
      get: {
        tags: ["Store"],
        summary: "List public application settings",
        description: "Returns only settings explicitly marked public and non-secret.",
        operationId: "listPublicAppSettings",
        responses: {
          "200": jsonResponse("Public application settings", {
            type: "object",
            required: ["settings"],
            properties: {
              settings: {
                type: "array",
                items: { $ref: "#/components/schemas/PublicAppSetting" },
              },
            },
          }),
        },
      },
    },
    "/store/inquiries": {
      post: {
        tags: ["Store"],
        summary: "Submit an inquiry",
        description: "Accepts contact, newsletter, wholesale, and corporate gifting inquiries.",
        operationId: "createStoreInquiry",
        requestBody: requestBody({ $ref: "#/components/schemas/CreateInquiry" }),
        responses: {
          "202": jsonResponse("Inquiry accepted", {
            type: "object",
            required: ["inquiry"],
            properties: {
              inquiry: { $ref: "#/components/schemas/InquiryReference" },
            },
          }),
          "400": errorResponse,
        },
      },
    },
    "/admin/inquiries": {
      get: {
        tags: ["Admin"],
        summary: "List recent inquiries",
        operationId: "listInquiries",
        security: adminSecurity,
        responses: {
          "200": jsonResponse("Up to 100 inquiries, newest first", {
            type: "object",
            required: ["inquiries", "count"],
            properties: {
              inquiries: {
                type: "array",
                items: { $ref: "#/components/schemas/Inquiry" },
              },
              count: { type: "integer", minimum: 0 },
            },
          }),
          "401": errorResponse,
          "403": errorResponse,
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create an inquiry",
        operationId: "createAdminInquiry",
        security: adminSecurity,
        requestBody: requestBody({ $ref: "#/components/schemas/AdminCreateInquiry" }),
        responses: {
          "201": jsonResponse("Inquiry created", {
            type: "object",
            required: ["inquiry"],
            properties: { inquiry: { $ref: "#/components/schemas/Inquiry" } },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
        },
      },
    },
    "/admin/inquiries/{id}": {
      post: {
        tags: ["Admin"],
        summary: "Update an inquiry",
        operationId: "updateInquiry",
        security: adminSecurity,
        parameters: [idParameter("id", "Inquiry ID")],
        requestBody: requestBody({ $ref: "#/components/schemas/UpdateInquiry" }),
        responses: {
          "200": jsonResponse("Updated inquiry", {
            type: "object",
            required: ["inquiry"],
            properties: { inquiry: { $ref: "#/components/schemas/Inquiry" } },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete an inquiry",
        operationId: "deleteInquiry",
        security: adminSecurity,
        parameters: [idParameter("id", "Inquiry ID")],
        responses: {
          "200": jsonResponse("Inquiry deleted", {
            $ref: "#/components/schemas/DeleteResult",
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
    },
    "/admin/gift-orders/{orderId}": {
      get: {
        tags: ["Admin"],
        summary: "Get gift details for an order",
        operationId: "getGiftOrder",
        security: adminSecurity,
        parameters: [idParameter("orderId", "Medusa order ID")],
        responses: {
          "200": jsonResponse("Gift metadata or null when the order is not a gift", {
            type: "object",
            required: ["gift_order"],
            properties: {
              gift_order: {
                oneOf: [{ $ref: "#/components/schemas/GiftOrder" }, { type: "null" }],
              },
            },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Update gift details for an order",
        operationId: "updateGiftOrder",
        security: adminSecurity,
        parameters: [idParameter("orderId", "Medusa order ID")],
        requestBody: requestBody({ $ref: "#/components/schemas/UpdateGiftOrder" }),
        responses: {
          "200": jsonResponse("Gift order updated", {
            type: "object",
            required: ["gift_order"],
            properties: { gift_order: { $ref: "#/components/schemas/GiftOrder" } },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete gift details for an order",
        operationId: "deleteGiftOrder",
        security: adminSecurity,
        parameters: [idParameter("orderId", "Medusa order ID")],
        responses: {
          "200": jsonResponse("Gift order deleted", {
            $ref: "#/components/schemas/DeleteResult",
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
    },
    "/admin/payment-audits": {
      get: {
        tags: ["Admin"],
        summary: "List payment callback audits",
        operationId: "listPaymentAudits",
        security: adminSecurity,
        responses: {
          "200": jsonResponse("Up to 100 payment audits, newest first", {
            type: "object",
            required: ["payment_audits", "count"],
            properties: {
              payment_audits: {
                type: "array",
                items: { $ref: "#/components/schemas/PaymentAudit" },
              },
              count: { type: "integer", minimum: 0 },
            },
          }),
          "401": errorResponse,
          "403": errorResponse,
        },
      },
    },
    "/admin/content/workspace": {
      get: {
        tags: ["Admin"],
        summary: "Get the content workspace directory",
        description:
          "Returns the configured Sanity Studio URL and the governed homepage, page, and content-library destinations used by the Medusa Admin extension.",
        operationId: "getContentWorkspace",
        security: adminSecurity,
        responses: {
          "200": jsonResponse("Content workspace directory", {
            type: "object",
            required: ["studio", "homepages", "pages", "library"],
            properties: {
              actor_id: { type: "string" },
              studio: {
                type: "object",
                required: ["configured", "url"],
                properties: {
                  configured: { type: "boolean" },
                  url: { type: "string", format: "uri" },
                },
              },
              homepages: {
                type: "array",
                items: { $ref: "#/components/schemas/ContentWorkspaceEntry" },
              },
              pages: {
                type: "array",
                items: { $ref: "#/components/schemas/ContentWorkspaceEntry" },
              },
              library: {
                type: "array",
                items: { $ref: "#/components/schemas/ContentWorkspaceEntry" },
              },
            },
          }),
          "401": errorResponse,
        },
      },
    },
    "/admin/superadmin/overview": {
      get: {
        tags: ["Super Admin"],
        summary: "Get the Super Admin operational overview",
        description: superAdminDescription,
        operationId: "getSuperAdminOverview",
        security: adminSecurity,
        responses: {
          "200": jsonResponse("Operational metrics, attention queues, activity, and integrations", {
            $ref: "#/components/schemas/SuperAdminOverview",
          }),
          "401": errorResponse,
          "403": errorResponse,
        },
      },
    },
    "/admin/superadmin/catalog": {
      get: {
        tags: ["Super Admin"],
        summary: "List enriched catalog products",
        description: superAdminDescription,
        operationId: "listSuperAdminCatalog",
        security: adminSecurity,
        parameters: [
          {
            name: "q",
            in: "query",
            description: "Search query.",
            schema: { type: "string", maxLength: 120 },
          },
          {
            name: "status",
            in: "query",
            schema: { $ref: "#/components/schemas/ProductStatus" },
          },
          ...paginationParameters,
        ],
        responses: {
          "200": jsonResponse("Catalog page", {
            type: "object",
            required: ["products", "count", "offset", "limit"],
            properties: {
              products: {
                type: "array",
                items: { $ref: "#/components/schemas/CatalogProduct" },
              },
              count: { type: "integer", minimum: 0 },
              offset: { type: "integer", minimum: 0 },
              limit: { type: "integer", minimum: 1 },
            },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
        },
      },
      post: {
        tags: ["Super Admin"],
        summary: "Create a business-ready catalog product",
        description:
          "Creates a Medusa product in a Bangla Blend storefront destination with one or more independently priced variants.",
        operationId: "createSuperAdminCatalogProduct",
        security: adminSecurity,
        requestBody: requestBody({ $ref: "#/components/schemas/CreateCatalogProduct" }),
        responses: {
          "201": jsonResponse("Created catalog product", {
            type: "object",
            required: ["product"],
            properties: {
              product: {
                oneOf: [{ $ref: "#/components/schemas/CatalogProduct" }, { type: "null" }],
              },
            },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "409": errorResponse,
        },
      },
    },
    "/admin/superadmin/catalog/{id}": {
      get: {
        tags: ["Super Admin"],
        summary: "Get an enriched catalog product",
        description: superAdminDescription,
        operationId: "getSuperAdminCatalogProduct",
        security: adminSecurity,
        parameters: [idParameter("id", "Medusa product ID")],
        responses: {
          "200": jsonResponse("Catalog product", {
            type: "object",
            required: ["product"],
            properties: { product: { $ref: "#/components/schemas/CatalogProduct" } },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
      post: {
        tags: ["Super Admin"],
        summary: "Update a catalog product and market/origin profiles",
        description: `${superAdminDescription} Publishing is rejected until storefront-readiness checks pass.`,
        operationId: "updateSuperAdminCatalogProduct",
        security: adminSecurity,
        parameters: [idParameter("id", "Medusa product ID")],
        requestBody: requestBody({ $ref: "#/components/schemas/UpdateCatalogProduct" }),
        responses: {
          "200": jsonResponse("Updated catalog product", {
            type: "object",
            required: ["product"],
            properties: {
              product: {
                oneOf: [{ $ref: "#/components/schemas/CatalogProduct" }, { type: "null" }],
              },
            },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
          "409": errorResponse,
        },
      },
      delete: {
        tags: ["Super Admin"],
        summary: "Delete a catalog product",
        description: superAdminDescription,
        operationId: "deleteSuperAdminCatalogProduct",
        security: adminSecurity,
        parameters: [idParameter("id", "Medusa product ID")],
        responses: {
          "200": jsonResponse("Product deleted", {
            $ref: "#/components/schemas/DeleteResult",
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
    },
    "/admin/superadmin/catalogs": {
      get: {
        tags: ["Super Admin"],
        summary: "List managed storefront catalogs",
        description:
          "Lists reusable product-category catalogs beneath Bangla Blend's fixed storefront sections.",
        operationId: "listStorefrontCatalogs",
        security: adminSecurity,
        responses: {
          "200": jsonResponse("Storefront catalogs", {
            type: "object",
            required: ["catalogs", "count"],
            properties: {
              catalogs: {
                type: "array",
                items: { $ref: "#/components/schemas/StorefrontCatalog" },
              },
              count: { type: "integer", minimum: 0 },
            },
          }),
          "401": errorResponse,
          "403": errorResponse,
        },
      },
      post: {
        tags: ["Super Admin"],
        summary: "Create a managed storefront catalog",
        description:
          "Creates a reusable catalog beneath a fixed storefront section, including Build a Box experiences.",
        operationId: "createStorefrontCatalog",
        security: adminSecurity,
        requestBody: requestBody({ $ref: "#/components/schemas/CreateStorefrontCatalog" }),
        responses: {
          "201": jsonResponse("Created storefront catalog", {
            type: "object",
            required: ["catalog"],
            properties: { catalog: { $ref: "#/components/schemas/StorefrontCatalog" } },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "409": errorResponse,
        },
      },
    },
    "/admin/superadmin/catalogs/{id}": {
      post: {
        tags: ["Super Admin"],
        summary: "Update a managed storefront catalog",
        description: "Updates the catalog presentation, activity, or Build a Box size.",
        operationId: "updateStorefrontCatalog",
        security: adminSecurity,
        parameters: [idParameter("id", "Medusa product category ID")],
        requestBody: requestBody({ $ref: "#/components/schemas/UpdateStorefrontCatalog" }),
        responses: {
          "200": jsonResponse("Updated storefront catalog", {
            type: "object",
            required: ["catalog"],
            properties: { catalog: { $ref: "#/components/schemas/StorefrontCatalog" } },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
      delete: {
        tags: ["Super Admin"],
        summary: "Delete a managed storefront catalog",
        description:
          "Deletes the catalog category and its product assignments without deleting products or transactional commerce records.",
        operationId: "deleteStorefrontCatalog",
        security: adminSecurity,
        parameters: [idParameter("id", "Medusa product category ID")],
        responses: {
          "200": jsonResponse("Storefront catalog deleted", {
            allOf: [
              { $ref: "#/components/schemas/DeleteResult" },
              {
                type: "object",
                properties: { detached_product_count: { type: "integer", minimum: 0 } },
              },
            ],
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
    },
    "/admin/superadmin/orders/{id}/workflow": {
      get: {
        tags: ["Admin"],
        summary: "Get the operational order roadmap",
        description:
          "Returns the payment, fulfillment, shipment, and delivery roadmap calculated from Medusa's authoritative order records.",
        operationId: "getOrderOperationsWorkflow",
        security: adminSecurity,
        parameters: [idParameter("id", "Internal Medusa order ID")],
        responses: {
          "200": jsonResponse("Operational order roadmap", {
            type: "object",
            required: ["workflow"],
            properties: { workflow: { $ref: "#/components/schemas/OrderWorkflow" } },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Advance an order to its next operational stage",
        description:
          "Runs the supported Medusa fulfillment, shipment, or delivery workflow. Stages cannot be skipped, and inventory and audit history remain authoritative.",
        operationId: "advanceOrderOperationsWorkflow",
        security: adminSecurity,
        parameters: [idParameter("id", "Internal Medusa order ID")],
        requestBody: requestBody({ $ref: "#/components/schemas/AdvanceOrderWorkflow" }),
        responses: {
          "200": jsonResponse("Updated operational order roadmap", {
            type: "object",
            required: ["workflow"],
            properties: { workflow: { $ref: "#/components/schemas/OrderWorkflow" } },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
          "409": errorResponse,
        },
      },
    },
    "/admin/superadmin/settings": {
      get: {
        tags: ["Super Admin"],
        summary: "List application settings",
        description: superAdminDescription,
        operationId: "listAppSettings",
        security: adminSecurity,
        parameters: [
          {
            name: "group",
            in: "query",
            schema: { type: "string", maxLength: 80 },
          },
          {
            name: "q",
            in: "query",
            schema: { type: "string", maxLength: 120 },
          },
        ],
        responses: {
          "200": jsonResponse("Application settings", {
            type: "object",
            required: ["settings", "count"],
            properties: {
              settings: {
                type: "array",
                items: { $ref: "#/components/schemas/AppSetting" },
              },
              count: { type: "integer", minimum: 0 },
            },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
        },
      },
      post: {
        tags: ["Super Admin"],
        summary: "Create an application setting",
        description: `${superAdminDescription} Secret settings cannot be public.`,
        operationId: "createAppSetting",
        security: adminSecurity,
        requestBody: requestBody({ $ref: "#/components/schemas/CreateAppSetting" }),
        responses: {
          "201": jsonResponse("Application setting created", {
            type: "object",
            required: ["setting"],
            properties: { setting: { $ref: "#/components/schemas/AppSetting" } },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "409": errorResponse,
        },
      },
    },
    "/admin/superadmin/settings/{id}": {
      get: {
        tags: ["Super Admin"],
        summary: "Get an application setting",
        description: superAdminDescription,
        operationId: "getAppSetting",
        security: adminSecurity,
        parameters: [idParameter("id", "Application setting ID")],
        responses: {
          "200": jsonResponse("Application setting", {
            type: "object",
            required: ["setting"],
            properties: { setting: { $ref: "#/components/schemas/AppSetting" } },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
      post: {
        tags: ["Super Admin"],
        summary: "Update an application setting",
        description: superAdminDescription,
        operationId: "updateAppSetting",
        security: adminSecurity,
        parameters: [idParameter("id", "Application setting ID")],
        requestBody: requestBody({ $ref: "#/components/schemas/UpdateAppSetting" }),
        responses: {
          "200": jsonResponse("Application setting updated", {
            type: "object",
            required: ["setting"],
            properties: { setting: { $ref: "#/components/schemas/AppSetting" } },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
      delete: {
        tags: ["Super Admin"],
        summary: "Delete an application setting",
        description: superAdminDescription,
        operationId: "deleteAppSetting",
        security: adminSecurity,
        parameters: [idParameter("id", "Application setting ID")],
        responses: {
          "200": jsonResponse("Application setting deleted", {
            $ref: "#/components/schemas/DeleteResult",
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "404": errorResponse,
        },
      },
    },
    "/admin/superadmin/audit-logs": {
      get: {
        tags: ["Super Admin"],
        summary: "List immutable administrative audit events",
        description: superAdminDescription,
        operationId: "listAdminAuditLogs",
        security: adminSecurity,
        parameters: [
          {
            name: "resource_type",
            in: "query",
            schema: { type: "string", maxLength: 100 },
          },
          {
            name: "action",
            in: "query",
            schema: { type: "string", maxLength: 120 },
          },
          {
            name: "actor_id",
            in: "query",
            schema: { type: "string", maxLength: 160 },
          },
          ...paginationParameters,
        ],
        responses: {
          "200": jsonResponse("Administrative audit page", {
            type: "object",
            required: ["audit_logs", "count", "offset", "limit", "immutable"],
            properties: {
              audit_logs: {
                type: "array",
                items: { $ref: "#/components/schemas/AdminAuditLog" },
              },
              count: { type: "integer", minimum: 0 },
              offset: { type: "integer", minimum: 0 },
              limit: { type: "integer", minimum: 1 },
              immutable: { type: "boolean", const: true },
            },
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
        },
      },
    },
    "/webhooks/sslcommerz/ipn": {
      post: {
        tags: ["Payments"],
        summary: "Receive an SSLCOMMERZ IPN",
        description:
          "Validates the notification against SSLCOMMERZ, records an idempotent audit, updates the payment session, and forwards the verified event to Medusa's payment hook.",
        operationId: "receiveSslCommerzIpn",
        requestBody: requestBody(
          { $ref: "#/components/schemas/SslCommerzIpn" },
          "application/x-www-form-urlencoded",
        ),
        responses: {
          "200": jsonResponse("Notification received or previously processed", {
            type: "object",
            required: ["received"],
            properties: {
              received: { type: "boolean", const: true },
              duplicate: { type: "boolean" },
              audit_id: { type: "string" },
            },
          }),
          "400": errorResponse,
          "404": errorResponse,
          "502": errorResponse,
        },
      },
    },
    "/webhooks/sslcommerz/success": {
      post: {
        tags: ["Payments"],
        summary: "Handle the customer success redirect",
        description:
          "Redirects to the storefront success page while verification is pending. This redirect does not mark an order paid.",
        operationId: "handleSslCommerzSuccess",
        responses: { "303": { description: "Redirect to storefront success page" } },
      },
    },
    "/webhooks/sslcommerz/fail": {
      post: {
        tags: ["Payments"],
        summary: "Handle a failed payment redirect",
        operationId: "handleSslCommerzFailure",
        responses: { "303": { description: "Redirect to storefront failure page" } },
      },
    },
    "/webhooks/sslcommerz/cancel": {
      post: {
        tags: ["Payments"],
        summary: "Handle a cancelled payment redirect",
        operationId: "handleSslCommerzCancellation",
        responses: { "303": { description: "Redirect to storefront cancellation page" } },
      },
    },
  },
  components: {
    securitySchemes: {
      adminBearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Medusa Admin user bearer token",
      },
      adminApiKey: {
        type: "apiKey",
        in: "header",
        name: "x-medusa-access-token",
        description: "Medusa Admin API key",
      },
    },
    schemas: {
      OrderWorkflowStep: {
        type: "object",
        required: ["key", "label", "description", "state"],
        properties: {
          key: {
            type: "string",
            enum: ["placed", "payment", "fulfilled", "shipped", "delivered"],
          },
          label: { type: "string" },
          description: { type: "string" },
          state: {
            type: "string",
            enum: ["complete", "current", "pending", "exception"],
          },
          at: { type: "string", format: "date-time" },
        },
      },
      OrderWorkflow: {
        type: "object",
        required: [
          "id",
          "reference",
          "line_item_count",
          "outstanding_quantity",
          "fulfillment_count",
          "status",
          "payment_status",
          "fulfillment_status",
          "payment_method",
          "steps",
          "next_action",
          "exception",
        ],
        properties: {
          id: { type: "string" },
          reference: {
            type: "string",
            description: "Business-visible sequence such as order_01; not an API identifier.",
          },
          line_item_count: { type: "integer", minimum: 0 },
          outstanding_quantity: { type: "number", minimum: 0 },
          fulfillment_count: { type: "integer", minimum: 0 },
          status: { type: "string" },
          payment_status: { type: "string" },
          fulfillment_status: { type: "string" },
          payment_method: { type: "string", enum: ["cod", "online"] },
          steps: {
            type: "array",
            minItems: 5,
            maxItems: 5,
            items: { $ref: "#/components/schemas/OrderWorkflowStep" },
          },
          next_action: {
            oneOf: [
              {
                type: "object",
                required: ["type", "label", "confirmation"],
                properties: {
                  type: { type: "string", enum: ["fulfill", "ship", "deliver"] },
                  label: { type: "string" },
                  confirmation: { type: "string" },
                  fulfillment_id: { type: "string" },
                },
              },
              { type: "null" },
            ],
          },
          exception: {
            oneOf: [
              {
                type: "object",
                required: ["label", "description"],
                properties: {
                  label: { type: "string" },
                  description: { type: "string" },
                },
              },
              { type: "null" },
            ],
          },
        },
      },
      AdvanceOrderWorkflow: {
        type: "object",
        required: ["action"],
        additionalProperties: false,
        properties: {
          action: { type: "string", enum: ["fulfill", "ship", "deliver"] },
          notify_customer: { type: "boolean", default: true },
        },
      },
      ContentWorkspaceEntry: {
        type: "object",
        required: ["title", "description", "schema_type"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          schema_type: { type: ["string", "null"] },
          document_id: { type: "string" },
        },
      },
      Error: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string" },
          errors: { type: "object", additionalProperties: true },
          issues: { type: "array", items: { type: "object", additionalProperties: true } },
          readiness: { type: "object", additionalProperties: true },
          audit_id: { type: "string" },
          duplicate: { type: "boolean" },
        },
      },
      DeleteResult: {
        type: "object",
        required: ["id", "object", "deleted"],
        properties: {
          id: { type: "string" },
          object: { type: "string" },
          deleted: { type: "boolean", const: true },
        },
      },
      ProductStatus: {
        type: "string",
        enum: ["draft", "proposed", "published", "rejected"],
      },
      InquiryStatus: {
        type: "string",
        enum: ["new", "acknowledged", "in_progress", "closed"],
      },
      CreateInquiry: {
        type: "object",
        required: ["type", "email"],
        properties: {
          type: { type: "string", enum: ["contact", "newsletter", "wholesale", "corporate"] },
          company: { type: "string", maxLength: 160 },
          contactPerson: { type: "string", maxLength: 120 },
          name: { type: "string", maxLength: 120 },
          email: { type: "string", format: "email" },
          telephone: { type: "string", maxLength: 30 },
          quantity: { type: "integer", minimum: 1 },
          budget: { type: "string", maxLength: 80 },
          occasion: { type: "string", maxLength: 120 },
          deliveryDate: { type: "string", format: "date-time" },
          deliveryLocations: { type: "string", maxLength: 500 },
          packaging: { type: "string", maxLength: 200 },
          messageCard: { type: "string", maxLength: 500 },
          subject: { type: "string", maxLength: 120 },
          message: { type: "string", maxLength: 3000 },
          notes: { type: "string", maxLength: 3000 },
        },
      },
      AdminCreateInquiry: {
        type: "object",
        required: ["type", "email"],
        properties: {
          type: { type: "string", enum: ["contact", "newsletter", "wholesale", "corporate"] },
          company: { type: ["string", "null"], maxLength: 160 },
          contact_person: { type: ["string", "null"], maxLength: 120 },
          email: { type: "string", format: "email" },
          telephone: { type: ["string", "null"], maxLength: 30 },
          quantity: { type: ["integer", "null"], minimum: 1 },
          budget: { type: ["string", "null"], maxLength: 80 },
          occasion: { type: ["string", "null"], maxLength: 120 },
          delivery_date: { type: ["string", "null"], format: "date-time" },
          delivery_locations: { type: ["string", "null"], maxLength: 500 },
          packaging: { type: ["string", "null"], maxLength: 200 },
          message_card: { type: ["string", "null"], maxLength: 500 },
          notes: { type: ["string", "null"], maxLength: 3000 },
          assigned_staff_id: { type: ["string", "null"], maxLength: 160 },
          internal_notes: { type: ["string", "null"], maxLength: 3000 },
        },
        additionalProperties: false,
      },
      UpdateInquiry: {
        type: "object",
        required: ["status"],
        properties: {
          status: { $ref: "#/components/schemas/InquiryStatus" },
          assigned_staff_id: { type: ["string", "null"], maxLength: 160 },
          internal_notes: { type: ["string", "null"], maxLength: 3000 },
        },
        additionalProperties: false,
      },
      InquiryReference: {
        type: "object",
        required: ["id", "status"],
        properties: {
          id: { type: "string" },
          status: { $ref: "#/components/schemas/InquiryStatus" },
        },
      },
      Inquiry: {
        allOf: [
          { $ref: "#/components/schemas/InquiryReference" },
          {
            type: "object",
            required: ["type", "email"],
            properties: {
              type: {
                type: "string",
                enum: ["contact", "newsletter", "wholesale", "corporate"],
              },
              company: { type: ["string", "null"] },
              contact_person: { type: ["string", "null"] },
              email: { type: "string", format: "email" },
              telephone: { type: ["string", "null"] },
              quantity: { type: ["integer", "null"] },
              budget: { type: ["string", "null"] },
              occasion: { type: ["string", "null"] },
              notes: { type: ["string", "null"] },
              assigned_staff_id: { type: ["string", "null"] },
              internal_notes: { type: ["string", "null"] },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      PublicAppSetting: {
        type: "object",
        required: ["key", "group", "label", "value", "value_type", "updated_at"],
        properties: {
          key: { type: "string" },
          group: { type: "string" },
          label: { type: "string" },
          value: {},
          value_type: { type: "string", enum: ["string", "number", "boolean", "json"] },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      AppSetting: {
        allOf: [
          { $ref: "#/components/schemas/PublicAppSetting" },
          {
            type: "object",
            required: ["id", "is_public", "is_secret", "sort_order"],
            properties: {
              id: { type: "string" },
              description: { type: ["string", "null"] },
              is_public: { type: "boolean" },
              is_secret: { type: "boolean" },
              sort_order: { type: "integer", minimum: 0 },
              metadata: { type: ["object", "null"], additionalProperties: true },
              updated_by: { type: ["string", "null"] },
            },
          },
        ],
      },
      CreateAppSetting: {
        type: "object",
        required: ["key", "label", "value"],
        properties: {
          key: {
            type: "string",
            minLength: 3,
            maxLength: 160,
            pattern: "^[a-z0-9]+(?:[._-][a-z0-9]+)*$",
          },
          group: { type: "string", minLength: 2, maxLength: 80, default: "general" },
          label: { type: "string", minLength: 2, maxLength: 160 },
          description: { type: ["string", "null"], maxLength: 1000 },
          value: {},
          value_type: {
            type: "string",
            enum: ["string", "number", "boolean", "json"],
            default: "string",
          },
          is_public: { type: "boolean", default: false },
          is_secret: { type: "boolean", default: false },
          sort_order: { type: "integer", minimum: 0, maximum: 10000, default: 0 },
          metadata: { type: ["object", "null"], additionalProperties: true },
        },
        additionalProperties: false,
      },
      UpdateAppSetting: {
        type: "object",
        properties: {
          group: { type: "string", minLength: 2, maxLength: 80 },
          label: { type: "string", minLength: 2, maxLength: 160 },
          description: { type: ["string", "null"], maxLength: 1000 },
          value: {},
          value_type: { type: "string", enum: ["string", "number", "boolean", "json"] },
          is_public: { type: "boolean" },
          is_secret: { type: "boolean" },
          sort_order: { type: "integer", minimum: 0, maximum: 10000 },
          metadata: { type: ["object", "null"], additionalProperties: true },
        },
        additionalProperties: false,
      },
      GiftOrder: {
        type: "object",
        required: ["id", "cart_id", "recipient_name", "recipient_telephone", "hide_prices"],
        properties: {
          id: { type: "string" },
          cart_id: { type: "string" },
          order_id: { type: ["string", "null"] },
          recipient_name: { type: "string" },
          recipient_telephone: { type: "string" },
          gift_message: { type: ["string", "null"] },
          hide_prices: { type: "boolean" },
          packaging_selection: { type: ["string", "null"] },
          preferred_delivery_date: { type: ["string", "null"], format: "date-time" },
          delivery_instructions: { type: ["string", "null"] },
          occasion: { type: ["string", "null"] },
          corporate_order_reference: { type: ["string", "null"] },
        },
      },
      UpdateGiftOrder: {
        type: "object",
        properties: {
          recipient_name: { type: "string", minLength: 2, maxLength: 120 },
          recipient_telephone: { type: "string", minLength: 6, maxLength: 30 },
          gift_message: { type: ["string", "null"], maxLength: 500 },
          hide_prices: { type: "boolean" },
          packaging_selection: { type: ["string", "null"], maxLength: 200 },
          preferred_delivery_date: { type: ["string", "null"], format: "date-time" },
          delivery_instructions: { type: ["string", "null"], maxLength: 500 },
          occasion: { type: ["string", "null"], maxLength: 120 },
          corporate_order_reference: { type: ["string", "null"], maxLength: 160 },
        },
        additionalProperties: false,
      },
      MarketProfile: {
        type: "object",
        properties: {
          bangladesh_available: { type: "boolean" },
          international_available: { type: "boolean" },
          supported_countries: {
            type: "array",
            maxItems: 80,
            items: { type: "string", minLength: 2, maxLength: 2 },
          },
          restricted_countries: {
            type: "array",
            maxItems: 80,
            items: { type: "string", minLength: 2, maxLength: 2 },
          },
          export_ready: { type: "boolean" },
          domestic_only: { type: "boolean" },
          shipping_classification: { type: ["string", "null"], maxLength: 160 },
          customs_description: { type: ["string", "null"], maxLength: 500 },
          country_of_origin: { type: ["string", "null"], maxLength: 120 },
          package_dimensions: { type: ["object", "null"], additionalProperties: true },
          storage_requirements: { type: ["string", "null"], maxLength: 1000 },
          temperature_requirements: { type: ["string", "null"], maxLength: 500 },
          shelf_life_days: { type: ["integer", "null"], minimum: 0, maximum: 3650 },
          minimum_shelf_life_at_dispatch_days: {
            type: ["integer", "null"],
            minimum: 0,
            maximum: 3650,
          },
          verified: { type: "boolean" },
        },
        additionalProperties: true,
      },
      OriginProfile: {
        type: "object",
        properties: {
          division: { type: ["string", "null"], maxLength: 120 },
          district: { type: ["string", "null"], maxLength: 120 },
          locality: { type: ["string", "null"], maxLength: 160 },
          producer_reference: { type: ["string", "null"], maxLength: 200 },
          harvest_date: { type: ["string", "null"], format: "date-time" },
          batch_number: { type: ["string", "null"], maxLength: 120 },
          latitude: { type: ["number", "null"], minimum: -90, maximum: 90 },
          longitude: { type: ["number", "null"], minimum: -180, maximum: 180 },
          verification_status: {
            type: "string",
            enum: ["draft", "in_review", "verified", "rejected"],
          },
          evidence_reference: { type: ["string", "null"], maxLength: 500 },
        },
        additionalProperties: true,
      },
      CatalogProduct: {
        type: "object",
        required: ["id", "title"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          handle: { type: "string" },
          subtitle: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          status: { $ref: "#/components/schemas/ProductStatus" },
          thumbnail: { type: ["string", "null"], format: "uri" },
          metadata: { type: ["object", "null"], additionalProperties: true },
          market_profile: {
            oneOf: [{ $ref: "#/components/schemas/MarketProfile" }, { type: "null" }],
          },
          origin_profile: {
            oneOf: [{ $ref: "#/components/schemas/OriginProfile" }, { type: "null" }],
          },
        },
        additionalProperties: true,
      },
      StorefrontCatalog: {
        type: "object",
        required: [
          "id",
          "name",
          "handle",
          "description",
          "section",
          "experience",
          "box_size",
          "is_active",
          "product_count",
        ],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          handle: { type: "string" },
          description: { type: "string" },
          section: {
            type: "string",
            enum: [
              "originals",
              "reserve",
              "pantry",
              "tea-wellness",
              "lifestyle-accessories",
              "gifts",
            ],
          },
          experience: { type: "string", enum: ["listing", "build_a_box"] },
          box_size: { type: ["integer", "null"], minimum: 2, maximum: 12 },
          is_active: { type: "boolean" },
          product_count: { type: "integer", minimum: 0 },
        },
        additionalProperties: false,
      },
      CreateStorefrontCatalog: {
        type: "object",
        required: ["name", "handle", "description", "section", "experience", "box_size"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 160 },
          handle: {
            type: "string",
            minLength: 1,
            maxLength: 160,
            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
          },
          description: { type: ["string", "null"], maxLength: 1000 },
          section: {
            type: "string",
            enum: [
              "originals",
              "reserve",
              "pantry",
              "tea-wellness",
              "lifestyle-accessories",
              "gifts",
            ],
          },
          experience: { type: "string", enum: ["listing", "build_a_box"] },
          box_size: { type: ["integer", "null"], minimum: 2, maximum: 12 },
        },
        additionalProperties: false,
      },
      UpdateStorefrontCatalog: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 160 },
          description: { type: ["string", "null"], maxLength: 1000 },
          is_active: { type: "boolean" },
          experience: { type: "string", enum: ["listing", "build_a_box"] },
          box_size: { type: ["integer", "null"], minimum: 2, maximum: 12 },
        },
        additionalProperties: false,
      },
      CreateCatalogVariant: {
        type: "object",
        required: ["title", "sku", "bdt_price", "stock_quantity"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 100, example: "100 g" },
          sku: {
            type: "string",
            minLength: 1,
            maxLength: 64,
            pattern: "^[A-Za-z0-9][A-Za-z0-9._-]*$",
            example: "MEZBANI-MASALA-100-G",
          },
          bdt_price: { type: "number", exclusiveMinimum: 0, example: 180 },
          stock_quantity: {
            type: "integer",
            minimum: 0,
            maximum: 1000000000,
            description: "Initial units stocked at the store's primary stock location.",
            example: 24,
          },
        },
        additionalProperties: false,
      },
      CreateCatalogProduct: {
        type: "object",
        required: [
          "title",
          "handle",
          "collection",
          "category_ids",
          "eligible_markets",
          "badges",
          "best_seller",
          "storefront_visible",
          "variants",
        ],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 160 },
          handle: {
            type: "string",
            minLength: 1,
            maxLength: 160,
            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
          },
          subtitle: { type: ["string", "null"], maxLength: 255 },
          description: { type: ["string", "null"], maxLength: 10000 },
          thumbnail: { type: ["string", "null"], format: "uri" },
          thumbnail_alt: { type: ["string", "null"], maxLength: 300 },
          collection: {
            type: "string",
            enum: [
              "originals",
              "reserve",
              "pantry",
              "tea-wellness",
              "lifestyle-accessories",
              "gifts",
            ],
          },
          gift_type: {
            type: ["string", "null"],
            enum: ["corporate", "set", "regional", null],
          },
          category_ids: {
            type: "array",
            maxItems: 50,
            items: { type: "string", minLength: 1, maxLength: 160 },
          },
          region: { type: ["string", "null"], maxLength: 160 },
          ingredients: { type: ["string", "null"], maxLength: 5000 },
          storage: { type: ["string", "null"], maxLength: 2000 },
          shelf_life: { type: ["string", "null"], maxLength: 1000 },
          usage: { type: ["string", "null"], maxLength: 3000 },
          eligible_markets: {
            type: "array",
            minItems: 1,
            items: { type: "string", enum: ["bd", "gb", "us", "ca", "eu", "au", "me"] },
          },
          badges: {
            type: "array",
            maxItems: 12,
            items: { type: "string", minLength: 1, maxLength: 80 },
          },
          best_seller: { type: "boolean" },
          storefront_visible: { type: "boolean" },
          variants: {
            type: "array",
            minItems: 1,
            maxItems: 100,
            items: { $ref: "#/components/schemas/CreateCatalogVariant" },
          },
        },
        additionalProperties: false,
      },
      UpdateCatalogProduct: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 160 },
          handle: {
            type: "string",
            minLength: 1,
            maxLength: 160,
            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
          },
          subtitle: { type: ["string", "null"], maxLength: 255 },
          description: { type: ["string", "null"], maxLength: 10000 },
          status: { $ref: "#/components/schemas/ProductStatus" },
          region: { type: ["string", "null"], maxLength: 160 },
          ingredients: { type: ["string", "null"], maxLength: 5000 },
          storage: { type: ["string", "null"], maxLength: 2000 },
          shelf_life: { type: ["string", "null"], maxLength: 1000 },
          usage: { type: ["string", "null"], maxLength: 3000 },
          eligible_markets: {
            type: "array",
            minItems: 1,
            items: { type: "string", enum: ["bd", "gb", "us", "ca", "eu", "au", "me"] },
          },
          badges: {
            type: "array",
            maxItems: 12,
            items: { type: "string", minLength: 1, maxLength: 80 },
          },
          best_seller: { type: "boolean" },
          gift_type: {
            type: ["string", "null"],
            enum: ["corporate", "set", "regional", null],
          },
          category_ids: {
            type: "array",
            maxItems: 50,
            items: { type: "string", minLength: 1, maxLength: 160 },
          },
          verified: { type: "boolean" },
          is_placeholder: { type: "boolean" },
          storefront_visible: { type: "boolean" },
          thumbnail_alt: { type: ["string", "null"], maxLength: 300 },
          image_alt_texts: {
            type: "object",
            additionalProperties: { type: "string", minLength: 1, maxLength: 300 },
          },
          market_profile: { $ref: "#/components/schemas/MarketProfile" },
          origin_profile: { $ref: "#/components/schemas/OriginProfile" },
        },
        additionalProperties: false,
      },
      PaymentAudit: {
        type: "object",
        required: [
          "id",
          "provider",
          "transaction_id",
          "event_type",
          "status",
          "idempotency_key",
          "payload_hash",
        ],
        properties: {
          id: { type: "string" },
          provider: { type: "string", example: "sslcommerz" },
          transaction_id: { type: "string" },
          order_reference: { type: ["string", "null"] },
          event_type: { type: "string", example: "ipn" },
          status: {
            type: "string",
            enum: ["validated", "rejected", "forwarded", "forward_failed"],
          },
          amount: { oneOf: [{ type: "number" }, { type: "string" }, { type: "null" }] },
          currency: { type: ["string", "null"] },
          idempotency_key: { type: "string" },
          payload_hash: { type: "string" },
          safe_payload: { type: ["object", "null"], additionalProperties: true },
          processed_at: { type: ["string", "null"], format: "date-time" },
        },
      },
      AdminAuditLog: {
        type: "object",
        required: ["id", "action", "resource_type"],
        properties: {
          id: { type: "string" },
          action: { type: "string" },
          resource_type: { type: "string" },
          resource_id: { type: ["string", "null"] },
          resource_label: { type: ["string", "null"] },
          actor_id: { type: ["string", "null"] },
          summary: { type: ["string", "null"] },
          before: { type: ["object", "null"], additionalProperties: true },
          after: { type: ["object", "null"], additionalProperties: true },
          created_at: { type: "string", format: "date-time" },
        },
        additionalProperties: true,
      },
      SuperAdminOverview: {
        type: "object",
        required: ["role", "metrics", "attention", "recent_activity", "integrations"],
        properties: {
          role: { type: "object", additionalProperties: true },
          metrics: { type: "object", additionalProperties: { type: "integer" } },
          attention: { type: "object", additionalProperties: true },
          recent_activity: {
            type: "array",
            items: { $ref: "#/components/schemas/AdminAuditLog" },
          },
          integrations: { type: "object", additionalProperties: true },
        },
      },
      SslCommerzIpn: {
        type: "object",
        required: ["tran_id", "val_id", "amount", "currency", "value_a"],
        properties: {
          tran_id: { type: "string" },
          val_id: { type: "string" },
          amount: { type: "string" },
          currency: { type: "string", example: "BDT" },
          value_a: { type: "string", description: "Medusa payment session ID" },
          session_id: { type: "string", description: "Fallback payment session ID" },
          status: { type: "string" },
          bank_tran_id: { type: "string" },
          risk_level: { type: "string" },
        },
        additionalProperties: { type: "string" },
      },
    },
  },
} as const;
