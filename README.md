# Bangla Blend

Bangla Blend is a Supabase-backed commerce and editorial platform for Bangladeshi products, gifts, recipes, and place-based stories. It has two Next.js applications: the public storefront and a private operations console.

## Repository map

```text
apps/storefront          Public commerce, accounts, checkout, and editorial experience
apps/admin               Staff operations, catalog, orders, content, settings, and RBAC
packages/supabase-client Shared browser, request-scoped, and service-role clients
packages/commerce-client Typed storefront commerce queries
packages/types           Shared domain contracts
packages/validation      Shared Zod validation
supabase/migrations      Versioned schema, RLS, storage, and production baseline changes for Cloud
scripts                  Release, smoke-test, bootstrap, and VPS deployment commands
tests                    Shared unit, integration, and Playwright suites
docs                     Architecture and operating runbooks
```

## Prerequisites

- Node.js 22 or newer
- pnpm 10 through Corepack
- Access to the Bangla Blend Supabase Cloud project
- Approved SSLCOMMERZ sandbox credentials for payment testing

## Setup

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env
Copy-Item apps/storefront/.env.example apps/storefront/.env.local
Copy-Item apps/admin/.env.example apps/admin/.env.local
```

Fill the Supabase Cloud keys in both application environment files. Keep `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, the database password, payment credentials, email credentials, and `REVALIDATE_SECRET` server-only. Do not use local Supabase keys.

For first-time setup, put `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` in the ignored root
`.env`, then configure and synchronize the exact Cloud project before starting either application:

```powershell
pnpm db:configure
```

For a new environment, bootstrap the first administrator using a secure email invitation:

```powershell
$env:SUPERADMIN_EMAIL='owner@your-domain.com'
$env:SUPERADMIN_FULL_NAME='Account Owner'
pnpm admin:bootstrap
```

Start the apps with `pnpm dev`. The storefront runs at `http://localhost:3000`; Admin runs at `http://localhost:3100`.

## Commands

```powershell
pnpm dev
pnpm dev:storefront
pnpm --filter @bangla-blend/admin dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm test:admin-smoke
pnpm build
pnpm check:production
pnpm db:configure
pnpm db:push
```

`pnpm db:push` is cloud-only and guarded: it verifies the exact linked project, rejects localhost,
runs a dry-run, applies pending migrations, and synchronizes production Auth callback settings.
The local reset workflow is intentionally not available.

`pnpm db:configure` retrieves the project's public/server keys without printing them, updates both
apps, links the project, and runs the guarded migration sync.

`ENABLE_DEVELOPMENT_FALLBACKS=true` is local-only. Sample products remain visibly marked and must never be treated as approved stock, claims, or content.

Production baseline records live in ordered migrations; local seed files are not part of the
repository. Checkout smoke tests create an explicitly marked temporary order only when
`CHECKOUT_SMOKE_ALLOW_ORDER=true`; remove it after verification and never run that test against
live customer data.

## Production

Deploy `apps/storefront` and `apps/admin` as separate HTTPS services: the storefront at `banglablend.store` and Admin at `bpanel.banglablend.store`. Run forward Supabase migrations before application rollout, store secrets in the hosting platform, configure Supabase Auth redirect URLs for the Admin callback, and run `pnpm check:production` plus the authenticated smoke tests before traffic is enabled.

Both apps build to a standalone Next.js server and ship as containers:

```powershell
docker build -f apps/storefront/Dockerfile -t bangla-blend-storefront .
docker build -f apps/admin/Dockerfile -t bangla-blend-admin .
```

Build from the repository root, and pass every `NEXT_PUBLIC_*` value as a `--build-arg` — they are inlined into the client bundle at build time, so changing one needs a rebuild rather than a restart. Copy [`.env.production.example`](.env.production.example) for the runtime variables.

For the Hostinger VPS, `sh scripts/deploy-vps.sh` validates the filled `.env`, builds both images,
and starts the localhost-bound containers. Install `infrastructure/caddy/Caddyfile` as
`/etc/caddy/Caddyfile` to route `banglablend.store` to the storefront and `bpanel.banglablend.store` to Admin over HTTPS.

See [architecture](docs/architecture.md), [administration](docs/administration.md), [Super Admin operations](docs/superadmin.md), [deployment](docs/deployment.md), [container deployment](docs/deployment-containers.md), [payments](docs/payments.md), and [testing](docs/testing.md).
