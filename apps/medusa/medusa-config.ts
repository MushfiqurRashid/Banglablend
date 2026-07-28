import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV ?? "development", process.cwd());

const s3FileOptions = {
  file_url: process.env.S3_FILE_URL?.trim() ?? "",
  endpoint: process.env.S3_ENDPOINT?.trim() ?? "",
  region: process.env.S3_REGION?.trim() ?? "",
  bucket: process.env.S3_BUCKET?.trim() ?? "",
  access_key_id: process.env.S3_ACCESS_KEY?.trim() ?? "",
  secret_access_key: process.env.S3_SECRET_KEY?.trim() ?? ""
};
const useS3FileProvider = Object.values(s3FileOptions).every(Boolean);

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "server" | "worker" | undefined) ?? "shared",
    http: {
      storeCors: process.env.STORE_CORS ?? "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS ?? "http://localhost:9000",
      authCors: process.env.AUTH_CORS ?? "http://localhost:3000,http://localhost:9000",
      jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
      cookieSecret: process.env.COOKIE_SECRET ?? "change-me-in-production"
    }
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000",
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true"
  },
  modules: [
    { resolve: "@medusajs/medusa/rbac" },
    ...(useS3FileProvider
      ? [{
          resolve: "@medusajs/medusa/file",
          options: {
            providers: [{
              resolve: "@medusajs/medusa/file-s3",
              id: "s3",
              options: s3FileOptions
            }]
          }
        }]
      : []),
    { resolve: "./src/modules/admin-control" },
    { resolve: "./src/modules/product-market" },
    { resolve: "./src/modules/product-origin" },
    { resolve: "./src/modules/gifting" },
    { resolve: "./src/modules/inquiry" },
    { resolve: "./src/modules/payment-audit" },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: process.env.SSLCOMMERZ_ENABLED === "true" ? [
          {
            resolve: "./src/modules/payments/sslcommerz",
            id: "sslcommerz",
            options: {
              storeId: process.env.SSLCOMMERZ_STORE_ID,
              storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
              sandbox: process.env.SSLCOMMERZ_SANDBOX !== "false",
              successUrl: process.env.SSLCOMMERZ_SUCCESS_URL,
              failUrl: process.env.SSLCOMMERZ_FAIL_URL,
              cancelUrl: process.env.SSLCOMMERZ_CANCEL_URL,
              ipnUrl: process.env.SSLCOMMERZ_IPN_URL
            }
          }
        ] : []
      }
    }
  ]
});
