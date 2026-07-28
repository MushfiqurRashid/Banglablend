# Deployment

Deploy the storefront, Medusa/Admin, and Studio as separate services. Use immutable artifacts and promote the same build through environments.

## Storefront

Build with `pnpm build:storefront` and run the Next.js standalone/server output behind an HTTPS CDN or ingress. Configure the public site origin, Medusa server/public origins and publishable key, Sanity read settings, Meilisearch search-only key, market flags, and signed webhook secret. Do not expose admin keys through `NEXT_PUBLIC_*` variables. Use production CSP without development-only evaluation permissions.

## Medusa and data services

Build with `pnpm build:medusa`. Run database migrations as a one-off release job before shifting traffic. Use managed PostgreSQL with encrypted storage, point-in-time recovery, restricted networking, and tested restores. Use managed Redis with authentication/TLS where supported. Separate Medusa server and worker modes at scale; deploy the worker before enabling event-driven email/search tasks.

Meilisearch requires persistent storage, an admin key available only to protected indexing jobs, and a search-only key available to the storefront server. Snapshot the index if operationally helpful, but treat it as rebuildable. After catalog/content changes, run `pnpm search:index` and verify market filters.

Sanity Studio builds with `pnpm build:studio` and can deploy to Sanity hosting or a restricted static host. Configure allowed CORS origins, least-privilege roles, dataset visibility, and signed webhooks. Studio credentials are never storefront credentials.

## Domains, TLS, and callbacks

Use dedicated origins such as `www`, `api`, and `studio`. Enforce HTTPS, HSTS after validation, secure cookies, exact CORS allowlists, and request-size/rate limits. Register the final HTTPS callback/IPN URLs with SSLCOMMERZ. Health checks should cover process availability; deeper synthetic monitoring should cover storefront → Medusa, database, search, and content queries without creating real orders.

## Environment and release order

Maintain separate local, preview, sandbox/staging, and production configuration. Store secrets in the deployment secret manager, rotate them after personnel/vendor changes, and never copy production customer data into lower environments.

Release order:

1. Back up and verify database recovery readiness.
2. Deploy backward-compatible database migrations and Medusa workers/server.
3. Rebuild/validate the search projection.
4. Deploy the storefront and Studio.
5. Run smoke tests, callback tests in the appropriate sandbox, accessibility checks, and monitoring verification.
6. Enable feature/market flags only after dependent operations are ready.

## Rollback

Rollback application artifacts independently when database changes remain backward compatible. For a faulty market/payment release, disable the affected provider/market first, then rollback code. Do not reverse a destructive migration against live data; ship a forward repair. Reconcile any payment events received during the incident and preserve audit records.
