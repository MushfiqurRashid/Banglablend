# Testing

## Automated suites

- `pnpm test:unit` checks shared validation, contracts, and security boundaries without external services.
- `pnpm --filter @bangla-blend/admin test` checks admin readiness, order transitions, list inputs, and content formatting.
- `RUN_INTEGRATION_TESTS=true pnpm test:integration` exercises configured Supabase and Meilisearch services with test-only data.
- `pnpm test:e2e` runs the storefront in desktop and mobile Chromium.
- `pnpm test:admin-smoke` visits every protected Admin route with a synthetic staff account and verifies the mobile navigation. Set `ADMIN_SMOKE_CREATE_USER=true` in controlled CI to create and remove that account automatically.
- `pnpm test:checkout-smoke` verifies the cart/checkout/order/admin path without using real customer or payment data.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` are release gates.

Integration suites skip unless explicitly enabled. A skipped external-service test is not release evidence.

## Test data

Use synthetic customers, addresses, staff identities, and provider-published sandbox payment instruments. Keep smoke credentials in the CI secret manager and remove temporary Auth users after each run. Development records remain unverified, draft, or explicitly marked as placeholders and must never be promoted as factual production content.

## Admin acceptance

- Each role sees only permitted navigation, protected direct routes stay protected, and read-only views cannot mutate data.
- Product publishing enforces title, description, image alternative text, collection, SKU, price, inventory, market eligibility, and verification readiness.
- Catalog assignment, inventory changes, order transitions, inquiry triage, settings, staff lifecycle, and content publication produce administrator audit entries.
- Order transitions reject stale or skipped states. Fulfillment consumes stock and releases reservations transactionally.
- Lists search, filter, count, paginate, and remain usable at mobile and desktop widths.
- Invitations, password reset, logout, expired links, disabled staff, self-deactivation, and last-Super-Admin protection work.

## Storefront and payment acceptance

Verify product availability, cart persistence, server-calculated totals, Bangladesh address validation, COD, SSLCOMMERZ redirects/IPN, duplicate callbacks, altered amount/currency/reference, order ownership, customer address ownership, content publication, and search indexing. Redirect success alone never counts as payment authorization.

Complete keyboard, focus, screen-reader, contrast, responsive layout, metadata, structured data, security-header, dependency, backup, monitoring, and rollback reviews. Automated tests do not replace payment settlement, shipping operations, accessibility, editorial, legal, or cultural review; record the accountable human approval for each release gate.
