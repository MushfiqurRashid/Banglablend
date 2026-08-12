# Deployment

Deploy the storefront and Admin as separate Next.js services backed by one Supabase project. Use immutable application builds, run database changes before application traffic moves, and keep preview, staging, and production credentials separate.

For container images, AWS service choices, and a VPS compose setup, see [container deployment](deployment-containers.md). Fill deployment variables from [`.env.production.example`](../.env.production.example).

## Services

- **Storefront:** build with `pnpm build:storefront`; expose it at the public HTTPS origin.
- **Admin:** build with `pnpm build:admin`; expose it at a different HTTPS origin and restrict access operationally where possible.
- **Supabase:** Auth, PostgreSQL, Storage, RLS, database functions, and backups.
- **Meilisearch:** a rebuildable search projection with a server-only admin key and a search-only query key.

Run the built applications with their package `start` commands or the hosting platform's native Next.js runtime. Never put service-role, payment, email, search-admin, or revalidation secrets in variables beginning with `NEXT_PUBLIC_`.

## Release order

1. Confirm a recoverable database backup and review the pending SQL migrations.
2. Link the intended Supabase project and run `pnpm db:push` from a controlled release job.
3. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` against the release commit.
4. Run `pnpm check:production` with the final deployment variables and recorded human approval gates.
5. Deploy Admin and the storefront, then run `pnpm test:admin-smoke` and `pnpm test:checkout-smoke` with synthetic accounts.
6. Rebuild the Meilisearch projection and verify public product/content routes.
7. Enable COD, SSLCOMMERZ, or a market only after its operational checks are signed off.

## Domains and callbacks

Use origins such as `https://www.example.com` and `https://admin.example.com`. Configure those exact URLs in the app environment and Supabase Auth redirect allowlist. The staff invitation/reset callback is:

```text
https://admin.example.com/auth/callback
```

Register the storefront's HTTPS SSLCOMMERZ success, failure, cancellation, and IPN endpoints with the merchant account. HSTS must only be enabled after HTTPS is working everywhere.

## Operations

Enable Supabase point-in-time recovery appropriate to the business, test restores, monitor Auth/database/storage limits, and alert on application errors, failed payments, webhook failures, low stock, and elevated admin activity. Apply rate limits at the hosting edge for authentication, inquiry, cart, checkout, and callback routes.

Application rollbacks are independent when migrations remain backward compatible. For a faulty payment or market release, disable the affected feature first. Repair live data with a reviewed forward migration; preserve payment and administrator audit evidence.
