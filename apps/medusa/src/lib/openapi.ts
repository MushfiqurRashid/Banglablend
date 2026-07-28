const errorResponse = {
  description: "Request failed",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" }
    }
  }
};

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Bangla Blend API",
    version: "0.1.0",
    description: "Interactive contract for Bangla Blend's custom Medusa store, administration, gifting, inquiry, payment-audit, and payment-webhook endpoints. Standard commerce resources are provided by Medusa."
  },
  servers: [
    { url: "http://localhost:9000", description: "Local Medusa backend" }
  ],
  tags: [
    { name: "Store", description: "Public storefront operations" },
    { name: "Admin", description: "Authenticated operational endpoints" },
    { name: "Payments", description: "SSLCOMMERZ callback endpoints" }
  ],
  paths: {
    "/store/inquiries": {
      post: {
        tags: ["Store"],
        summary: "Submit an inquiry",
        description: "Accepts contact, newsletter, wholesale, and corporate-gifting inquiries.",
        operationId: "createInquiry",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateInquiry" }
            }
          }
        },
        responses: {
          "202": {
            description: "Inquiry accepted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["inquiry"],
                  properties: { inquiry: { $ref: "#/components/schemas/InquiryReference" } }
                }
              }
            }
          },
          "400": errorResponse
        }
      }
    },
    "/admin/inquiries": {
      get: {
        tags: ["Admin"],
        summary: "List recent inquiries",
        operationId: "listInquiries",
        security: [{ adminBearer: [] }, { adminApiKey: [] }],
        responses: {
          "200": {
            description: "Up to 100 inquiries, newest first",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["inquiries", "count"],
                  properties: {
                    inquiries: { type: "array", items: { $ref: "#/components/schemas/Inquiry" } },
                    count: { type: "integer", minimum: 0 }
                  }
                }
              }
            }
          },
          "401": errorResponse
        }
      }
    },
    "/admin/inquiries/{id}": {
      post: {
        tags: ["Admin"],
        summary: "Update an inquiry",
        operationId: "updateInquiry",
        security: [{ adminBearer: [] }, { adminApiKey: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateInquiry" } }
          }
        },
        responses: {
          "200": {
            description: "Updated inquiry",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["inquiry"],
                  properties: { inquiry: { $ref: "#/components/schemas/Inquiry" } }
                }
              }
            }
          },
          "400": errorResponse,
          "401": errorResponse,
          "404": errorResponse
        }
      }
    },
    "/admin/payment-audits": {
      get: {
        tags: ["Admin"],
        summary: "List payment callback audits",
        operationId: "listPaymentAudits",
        security: [{ adminBearer: [] }, { adminApiKey: [] }],
        responses: {
          "200": {
            description: "Up to 100 payment audits, newest first",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["payment_audits", "count"],
                  properties: {
                    payment_audits: { type: "array", items: { $ref: "#/components/schemas/PaymentAudit" } },
                    count: { type: "integer", minimum: 0 }
                  }
                }
              }
            }
          },
          "401": errorResponse
        }
      }
    },
    "/admin/gift-orders/{orderId}": {
      get: {
        tags: ["Admin"],
        summary: "Get gift details for an order",
        operationId: "getGiftOrder",
        security: [{ adminBearer: [] }, { adminApiKey: [] }],
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string", pattern: "^[A-Za-z0-9_-]+$" } }],
        responses: {
          "200": {
            description: "Gift metadata or null when the order is not a gift",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["gift_order"],
                  properties: { gift_order: { oneOf: [{ $ref: "#/components/schemas/GiftOrder" }, { type: "null" }] } }
                }
              }
            }
          },
          "400": errorResponse,
          "401": errorResponse
        }
      }
    },
    "/webhooks/sslcommerz/ipn": {
      post: {
        tags: ["Payments"],
        summary: "Receive an SSLCOMMERZ IPN",
        description: "Validates the notification against SSLCOMMERZ, records an idempotent audit, updates the payment session, and forwards the verified event to Medusa's payment hook.",
        operationId: "receiveSslCommerzIpn",
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: { $ref: "#/components/schemas/SslCommerzIpn" }
            }
          }
        },
        responses: {
          "200": {
            description: "Notification received or previously processed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["received"],
                  properties: {
                    received: { type: "boolean", const: true },
                    duplicate: { type: "boolean" },
                    audit_id: { type: "string" }
                  }
                }
              }
            }
          },
          "400": errorResponse,
          "404": errorResponse,
          "502": errorResponse
        }
      }
    },
    "/webhooks/sslcommerz/success": {
      post: {
        tags: ["Payments"],
        summary: "Handle the customer success redirect",
        description: "Redirects to the storefront's pending-verification success page. This redirect does not mark an order paid.",
        operationId: "handleSslCommerzSuccess",
        responses: { "303": { description: "Redirect to storefront success page" } }
      }
    },
    "/webhooks/sslcommerz/fail": {
      post: {
        tags: ["Payments"],
        summary: "Handle a failed payment redirect",
        operationId: "handleSslCommerzFailure",
        responses: { "303": { description: "Redirect to storefront failure page" } }
      }
    },
    "/webhooks/sslcommerz/cancel": {
      post: {
        tags: ["Payments"],
        summary: "Handle a cancelled payment redirect",
        operationId: "handleSslCommerzCancellation",
        responses: { "303": { description: "Redirect to storefront cancellation page" } }
      }
    }
  },
  components: {
    securitySchemes: {
      adminBearer: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Medusa Admin user bearer token" },
      adminApiKey: { type: "apiKey", in: "header", name: "x-medusa-access-token", description: "Medusa Admin API key" }
    },
    schemas: {
      Error: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string" },
          issues: { type: "array", items: { type: "object", additionalProperties: true } },
          audit_id: { type: "string" },
          duplicate: { type: "boolean" }
        }
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
          notes: { type: "string", maxLength: 3000 }
        }
      },
      UpdateInquiry: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["new", "acknowledged", "in_progress", "closed"] },
          assigned_staff_id: { type: "string" },
          internal_notes: { type: "string", maxLength: 3000 }
        }
      },
      InquiryReference: {
        type: "object",
        required: ["id", "status"],
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["new", "acknowledged", "in_progress", "closed"] }
        }
      },
      Inquiry: {
        allOf: [
          { $ref: "#/components/schemas/InquiryReference" },
          {
            type: "object",
            required: ["type", "email"],
            properties: {
              type: { type: "string", enum: ["contact", "newsletter", "wholesale", "corporate"] },
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
              updated_at: { type: "string", format: "date-time" }
            }
          }
        ]
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
          corporate_order_reference: { type: ["string", "null"] }
        }
      },
      PaymentAudit: {
        type: "object",
        required: ["id", "provider", "transaction_id", "event_type", "status", "idempotency_key", "payload_hash"],
        properties: {
          id: { type: "string" },
          provider: { type: "string", example: "sslcommerz" },
          transaction_id: { type: "string" },
          order_reference: { type: ["string", "null"] },
          event_type: { type: "string", example: "ipn" },
          status: { type: "string", enum: ["validated", "rejected", "forwarded", "forward_failed"] },
          amount: { oneOf: [{ type: "number" }, { type: "string" }, { type: "null" }] },
          currency: { type: ["string", "null"] },
          idempotency_key: { type: "string" },
          payload_hash: { type: "string" },
          safe_payload: { type: ["object", "null"], additionalProperties: true },
          processed_at: { type: ["string", "null"], format: "date-time" }
        }
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
          risk_level: { type: "string" }
        },
        additionalProperties: { type: "string" }
      }
    }
  }
} as const;
