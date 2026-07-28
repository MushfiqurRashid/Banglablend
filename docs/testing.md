# Testing

## Suites

- `pnpm test:unit` runs pure contract, validation, and security-boundary checks without services.
- `RUN_INTEGRATION_TESTS=true pnpm test:integration` runs against configured Medusa, Sanity, and Meilisearch instances. Seed first and provide test-only credentials/region IDs. These tests skip by default so a missing service is never mistaken for a pass.
- `pnpm test:e2e` runs Playwright in desktop and mobile Chromium. It starts the local storefront unless `E2E_BASE_URL` targets an existing environment.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` are required release gates.

## Sandbox data and accounts

Use only synthetic customer names/addresses and provider-published sandbox payment instruments. Store test account credentials in CI secrets. Never use real card, customer, or recipient data. The development seed is visibly marked `isPlaceholder: true`, `verified: false`, or `status: "draft"` and must not be promoted as factual content.

For SSLCOMMERZ, capture evidence for approved, declined, cancelled, expired, tampered amount/currency/reference, duplicate IPN, delayed IPN, and validation outage. Confirm that redirects alone remain unpaid, duplicate processing is harmless, and no credential or sensitive payload reaches logs/browser code.

## Acceptance checklist

- Product retrieval, collection filtering/sorting, variant selection, real regional price, eligibility, stock enforcement, promotions, and unavailable states work.
- Destination changes clear/revalidate incompatible carts; pricing and availability never rely on client conversion.
- Add, persist, update, remove, restore, and expire cart flows behave safely.
- Bangladesh addresses, domestic shipping, COD, SSLCOMMERZ, failed/cancelled callbacks, validation, replay, and order creation pass.
- Billing/delivery country differences and gifts sent to Bangladesh from abroad work; recipient/message/price-hiding/date/instructions reach operations.
- International checkout stays disabled until a provider, carriers, prices, returns, export, and duties behavior are approved.
- Registration, login, logout, reset, address ownership, order ownership, inquiry/forms, email failure handling, and rate limits pass.
- Unified search handles English, Bangla, transliteration, content types, no-results, and selected-market filtering; only verified editorial documents appear.
- Staff can manage commerce in Medusa and content in Sanity without source changes; signed revalidation and indexing recover from failure.
- Keyboard navigation, focus visibility, dialogs, form errors, reduced motion, color contrast, image alt text, headings/landmarks, and screen-reader labels pass WCAG-oriented review.
- Metadata, canonical URLs, sitemap/robots, Product/Recipe/Article/Organization structured data, 404s, redirects, responsive layouts, Core Web Vitals, cache behavior, and broken-link checks pass.
- CSP/security headers, secure cookies, CORS, CSRF posture, authorization, validation, webhook/payment secrets, dependency scans, backups, rollback, monitoring, and alerting are reviewed.
- No protected reference-site assets/copy or unverified farmers, certifications, awards, reviews, press, medical, impact, or sustainability claims are shipped.

Automated tests are necessary but not sufficient for payment settlement, accessibility, culturally accurate editorial review, shipping operations, or legal approval. Record the responsible human sign-off for those gates.
