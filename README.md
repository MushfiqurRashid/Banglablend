# Bangla Blend

Bangla Blend is a custom, dual-market commerce and editorial platform for regional Bangladeshi products, gifts, recipes, and place-based stories. Bangladesh and international shopping are first-class journeys; eligibility, pricing, shipping, and payment behavior are controlled by the selected destination.

The repository deliberately separates the storefront, commerce backend/Admin, content Studio, shared contracts, infrastructure, tests, and documentation. Development fallback content is visibly sample-only and can never be purchased.

## Repository map

```text
apps/storefront       Next.js App Router customer experience and server boundary
apps/medusa           Medusa commerce API, Admin extensions, modules, workflows
apps/studio           Sanity Studio and individual editorial schemas
packages/types        Shared TypeScript contracts
packages/validation   Shared Zod validation
packages/commerce-client  Medusa adapter and development-only fixtures
packages/search-client    Meilisearch query contract
infrastructure        Reviewable search and ingress configuration
tests                 Unit, integration, and Playwright suites
docs                  Architecture and operating runbooks
```

## Prerequisites

- Node.js 22 or newer (Node 24 LTS is supported)
- pnpm 10 through Corepack
- Docker Desktop or separately managed PostgreSQL, Redis, and Meilisearch
- A Sanity project for editable content
- SSLCOMMERZ sandbox credentials to exercise the gateway path

## Installation

```bash
corepack enable
pnpm install
copy .env.example .env
copy apps/storefront/.env.example apps/storefront/.env.local
copy apps/medusa/.env.example apps/medusa/.env
copy apps/studio/.env.example apps/studio/.env
```

On macOS/Linux use `cp` instead of `copy`. Generate strong independent values for `JWT_SECRET`, `COOKIE_SECRET`, and `SANITY_WEBHOOK_SECRET`. Do not reuse the local examples in a deployed environment.

## Local setup

1. Start PostgreSQL, Redis, and Meilisearch: `docker compose up -d`.
2. Configure Medusa and run `pnpm db:migrate`.
3. Start Medusa once, create the initial Admin user and publishable API key, and place the key in `apps/storefront/.env.local` as `MEDUSA_PUBLISHABLE_API_KEY`.
4. Run `pnpm seed`. Sample records are placeholders, not approved product claims.
5. Configure the Sanity project ID/dataset in both Studio and storefront environments.
6. Run `pnpm search:index` after the seed.
7. Start all applications with `pnpm dev`, or use `pnpm dev:storefront`, `pnpm dev:medusa`, and `pnpm dev:studio` separately.

After pulling a catalog update into an existing local environment, run `pnpm catalog:sync`. This
removes retired sample products from the persistent Medusa database and rebuilds Meilisearch
without stale product documents.

Use the local-only credentials, bootstrap command, native RBAC checklist, and data-ownership rules in
[Superadmin operations](docs/superadmin.md). Rotate the documented bootstrap password before the
environment is shared or deployed.

Default local URLs are storefront `http://localhost:3000`, Medusa/Admin `http://localhost:9000`, Studio `http://localhost:3333`, and Meilisearch `http://localhost:7700`.

Interactive Swagger documentation for the custom Bangla Blend backend is available at `http://localhost:9000/docs`. The OpenAPI 3.1 contract is served at `http://localhost:9000/openapi.json`. Admin operations require a Medusa bearer token or Admin API key before Swagger's **Try it out** requests can succeed.

`ENABLE_DEVELOPMENT_FALLBACKS=true` is local-only. When Medusa is unavailable, the storefront may render visibly labeled placeholders for design review, but purchase actions remain disabled. Never set it in production.

## Sanity and search

Create a Sanity dataset, configure its CORS origins, and add a read token only when the dataset is private. In Studio, editorial content moves through draft, in-review, verified, and archived states. The public search indexing script accepts editorial documents only when both `verification.status == "verified"` and `verification.verified == true`.

Configure a publish webhook to the storefront `/api/revalidate/sanity` endpoint with an HMAC SHA-256 signature in `x-bangla-blend-signature`. Trigger `pnpm search:index` from a protected deployment job after verified content changes.

## Payments

Cash on Delivery uses Medusa's system provider. SSLCOMMERZ session creation, credential use, IPN validation, amount/currency checks, and authorization live in the backend. Success redirects do not mark orders paid. Keep sandbox mode enabled until callback, replay/idempotency, failed payment, cancellation, and reconciliation tests pass. See [docs/payments.md](docs/payments.md).

## Commands

```bash
pnpm dev
pnpm db:migrate
pnpm seed
pnpm catalog:sync
pnpm search:index
pnpm lint
pnpm typecheck
pnpm test
pnpm test:unit
RUN_INTEGRATION_TESTS=true pnpm test:integration
pnpm test:e2e
pnpm build
```

Integration tests expect live dependencies and intentionally skip unless `RUN_INTEGRATION_TESTS=true`. Playwright starts the storefront automatically, or targets `E2E_BASE_URL` when provided.

## Build and deployment

Build everything with `pnpm build`, or build a boundary independently with `pnpm build:storefront`, `pnpm build:medusa`, or `pnpm build:studio`. Deploy each application independently, use managed PostgreSQL/Redis/Meilisearch for production, terminate TLS at the edge, and store all secrets in the platform secret manager. Follow [docs/deployment.md](docs/deployment.md) and the prelaunch acceptance list in [docs/testing.md](docs/testing.md).

Before a production release, run `pnpm check:production` with the deployment environment loaded. It fails closed on missing secrets, insecure service URLs, development fallbacks, unconfigured payment dependencies, and the four recorded human approval gates for catalog, editorial, legal, and operations.

More detail: [architecture](docs/architecture.md), [content model](docs/content-model.md), [commerce model](docs/commerce-model.md), [payments](docs/payments.md), [administration](docs/administration.md), and [testing](docs/testing.md).
