# Payments

The storefront implements Cash on Delivery and SSLCOMMERZ behind server-only payment code. Future bKash, Nagad, wallet, or international providers must follow the same authoritative amount, callback validation, idempotency, and audit rules before a market is enabled.

COD is offered only when `COD_ENABLED=true` and operations approve collection. It creates an authorized payment state for operational progression; it does not claim that cash has already settled.

## SSLCOMMERZ flow

1. Checkout calculates the authoritative cart, delivery, and total values on the server.
2. The server creates payment collection/session rows and requests a gateway session with server-held credentials.
3. The customer follows only the returned gateway URL.
4. Success, failure, and cancellation redirects show customer status but do not authorize payment.
5. The IPN route derives replay evidence, validates the transaction with SSLCOMMERZ, and compares amount, currency, order reference, and expected state.
6. A valid IPN updates payment/order state and writes the append-only `payment_audits` record.

Local callbacks must use an approved public HTTPS tunnel. Production requires `SSLCOMMERZ_SANDBOX=false`, merchant-approved live credentials, registered callback URLs, monitoring, and a written reconciliation/refund procedure.

## Failure and reconciliation

Missing fields, validation outage, mismatched totals, unknown sessions, invalid state, or risk rejection remain unpaid. IPNs can be duplicated, delayed, or out of order, so processing must stay idempotent. Do not log card data, the store password, or unredacted gateway payloads.

Before release, capture sandbox evidence for approved, declined, cancelled, expired, altered amount, altered currency, altered reference, duplicate, delayed, and validation-timeout cases. Reconcile gateway transactions to payment sessions and orders daily during launch.

Automated refunds are not implemented. An authorized operator records the request, refunds through the approved merchant process, verifies settlement, and preserves evidence in the order/payment audit trail. Never report a refund successful from a browser response.

## Adding a provider

Add a server-only provider adapter under the storefront payment library, map its states into the Supabase payment model, validate callbacks independently of redirects, define retries and idempotency, add production gates, and complete integration and reconciliation tests before enabling it.
