# Infrastructure boundaries

Supabase provides PostgreSQL, Auth, Storage, and the public data APIs used by both Next.js applications. Search reads eligible records directly from Supabase and requires no separate index service.

- `caddy/Caddyfile` is the Hostinger VPS ingress for `banglablend.store` and `bpanel.banglablend.store`, with `www` redirected to the storefront apex. It terminates TLS while application ports remain bound to localhost.
- Admin publication workflows call the storefront's signed content revalidation endpoint after verified editorial changes.
- SSLCOMMERZ callbacks terminate at the storefront's protected payment routes. Only server-side validation and the payment provider can authorize a payment.

Secrets belong in the deployment platform's encrypted secret store, never in images, source control, or browser-visible variables.
