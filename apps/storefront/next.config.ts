import path from "node:path";
import type { NextConfig } from "next";

const developmentScriptPolicy =
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
const commerceBackend = process.env.NEXT_PUBLIC_SUPABASE_URL;
let commerceOrigin = "";

try {
  if (commerceBackend) {
    const parsed = new URL(commerceBackend);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") commerceOrigin = parsed.origin;
  }
} catch {
  commerceOrigin = "";
}

const contentSecurityPolicy = [
  "default-src 'self'",
  developmentScriptPolicy,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: https:${commerceOrigin ? ` ${commerceOrigin}` : ""}`,
  "font-src 'self' data: https:",
  `connect-src 'self' https:${commerceOrigin ? ` ${commerceOrigin}` : ""}`,
  "object-src 'none'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep Turbopack's development graph away from the production build. Reusing `.next` after
  // `next build` can leave the Windows dev server indefinitely compiling the proxy entrypoint.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // Self-contained server bundle for the container image. outputFileTracingRoot points at the
  // workspace root so tracing follows the pnpm symlinks into packages/* and node_modules/.pnpm.
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    formats: ["image/webp"],
    deviceSizes: [480, 640, 768, 1080, 1440, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    qualities: [70, 75, 85],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.dev" },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
