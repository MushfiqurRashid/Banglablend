# Build from the REPOSITORY ROOT, not this directory:
#   docker build -f apps/admin/Dockerfile -t bangla-blend-admin .
# pnpm workspace packages (packages/*) are only resolvable with the root as build context.
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

# ---- dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/storefront/package.json apps/storefront/
COPY apps/admin/package.json apps/admin/
COPY packages/commerce-client/package.json packages/commerce-client/
COPY packages/search-client/package.json packages/search-client/
COPY packages/supabase-client/package.json packages/supabase-client/
COPY packages/types/package.json packages/types/
COPY packages/validation/package.json packages/validation/
RUN pnpm install --frozen-lockfile

# ---- build ------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, and next.config.ts reads
# NEXT_PUBLIC_SUPABASE_URL to build the CSP -- so these must be present now, not just at runtime.
# NEXT_PUBLIC_ADMIN_URL is also the origin Supabase emails staff invitation/reset links from.
ARG NEXT_PUBLIC_ADMIN_URL
ARG NEXT_PUBLIC_STOREFRONT_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL \
    NEXT_PUBLIC_STOREFRONT_URL=$NEXT_PUBLIC_STOREFRONT_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production
RUN pnpm --filter @bangla-blend/admin build

# ---- runtime ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3100 HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# `output: "standalone"` with outputFileTracingRoot at the workspace root mirrors the monorepo
# layout inside .next/standalone, so the server entrypoint stays at apps/admin/server.js.
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public

USER nextjs
EXPOSE 3100
CMD ["node", "apps/admin/server.js"]
