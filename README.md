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
supabase/migrations      Ordered schema, RLS, functions, storage, and hardening changes
supabase/seed            Local-only development records
scripts                  Release, smoke-test, bootstrap, and indexing commands
tests                    Shared unit, integration, and Playwright suites
docs                     Architecture and operating runbooks
```

## Prerequisites

- Node.js 22 or newer
- pnpm 10 through Corepack
- A Supabase project, or Docker Desktop for the Supabase local stack
- Meilisearch when search indexing is enabled
- Approved SSLCOMMERZ sandbox credentials for payment testing

## Setup

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env
Copy-Item apps/storefront/.env.example apps/storefront/.env.local
Copy-Item apps/admin/.env.example apps/admin/.env.local
```

Fill the Supabase URL and keys in both application environment files. Keep `SUPABASE_SERVICE_ROLE_KEY`, payment credentials, email credentials, and `REVALIDATE_SECRET` server-only.

Apply the database migrations before starting either application:

```powershell
supabase link --project-ref fwcwhiprbaqqwiyryhpa
pnpm db:push
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
pnpm db:push
pnpm search:index
```

`ENABLE_DEVELOPMENT_FALLBACKS=true` is local-only. Sample products remain visibly marked and must never be treated as approved stock, claims, or content.

## Production

Deploy `apps/storefront` and `apps/admin` as separate HTTPS services. Run forward Supabase migrations before application rollout, store secrets in the hosting platform, configure Supabase Auth redirect URLs for the admin callback, and run `pnpm check:production` plus the authenticated smoke tests before traffic is enabled.

Both apps build to a standalone Next.js server and ship as containers:

```powershell
docker build -f apps/storefront/Dockerfile -t bangla-blend-storefront .
docker build -f apps/admin/Dockerfile -t bangla-blend-admin .
```

Build from the repository root, and pass every `NEXT_PUBLIC_*` value as a `--build-arg` — they are inlined into the client bundle at build time, so changing one needs a rebuild rather than a restart. Copy [`.env.production.example`](.env.production.example) for the runtime variables.

See [architecture](docs/architecture.md), [administration](docs/administration.md), [Super Admin operations](docs/superadmin.md), [deployment](docs/deployment.md), [container deployment](docs/deployment-containers.md), [payments](docs/payments.md), and [testing](docs/testing.md).
