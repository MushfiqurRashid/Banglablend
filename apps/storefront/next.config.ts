import type { NextConfig } from "next";

const developmentScriptPolicy =
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
const commerceBackend =
  process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
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
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.dev" },
    ],
  },
  async headers() {
    return [
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
