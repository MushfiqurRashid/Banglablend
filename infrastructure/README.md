# Infrastructure boundaries

Local dependencies run through the root `docker-compose.yml`: PostgreSQL, Redis, and Meilisearch. The Next.js storefront, Medusa service, and Sanity Studio stay separate deployable applications.

- `meilisearch/settings.json` is the reviewable index contract. Run `pnpm search:index` after the database seed and whenever a full rebuild is required.
- `nginx/storefront.conf` demonstrates edge rate limiting for public inquiry endpoints. Production ingress must also terminate TLS and apply platform-level request limits.
- Sanity publish webhooks should call `/api/revalidate/sanity` with an HMAC SHA-256 digest in `x-bangla-blend-signature`; run the protected search indexing job after verified editorial changes.
- SSLCOMMERZ callbacks terminate at Medusa `/webhooks/sslcommerz/*`. Only server-side validation and the payment provider can authorize a payment.

Secrets belong in the deployment platform's encrypted secret store, never in images, source control, or browser-visible variables.
