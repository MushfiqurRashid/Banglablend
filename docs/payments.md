# Payments

## Provider boundary

Payment behavior implements a backend-only adapter contract. The initial adapters are Cash on Delivery and SSLCOMMERZ; future bKash, Nagad, Stripe, PayPal, or regional providers must implement the same lifecycle without changing checkout form ownership.

Cash on Delivery uses Medusa's system provider and is offered only where operations approve collection. It creates an order with a pending payment state; staff follow the fulfillment and collection procedure rather than marking it paid at checkout.

## SSLCOMMERZ sandbox flow

1. Checkout creates a Medusa payment collection and initializes `pp_sslcommerz_sslcommerz`.
2. Medusa calculates the authoritative amount/currency and the provider calls the SSLCOMMERZ session API with server-held credentials.
3. The customer receives and follows only the returned gateway URL.
4. Success, fail, and cancel browser callbacks redirect to a storefront status page. They do not authorize the payment.
5. The IPN endpoint requires transaction, validation, amount, and currency fields, derives an idempotency key, and calls the validation API from the server.
6. Only a valid response matching expected amount, currency, and order reference is forwarded to Medusa's payment hook.
7. A safe audit record supports reconciliation and replay detection. Never log card details, store password, or the full unredacted payload.

Local callback URLs must be publicly reachable by the sandbox (for example through an approved HTTPS tunnel). Set all `SSLCOMMERZ_*_URL` values to the public routes and keep `SSLCOMMERZ_SANDBOX=true`.

## Failure, replay, and reconciliation

Treat missing fields, validation-network failure, mismatch, risk rejection, unknown sessions, and invalid states as unpaid. IPNs may arrive more than once or out of order; processing must be idempotent and retriable. A customer-visible success page is informational until the backend reports authorization.

Before release, exercise approved, declined, cancelled, expired, altered-amount, altered-currency, duplicate, delayed, and validation-timeout cases. Reconcile gateway transactions to Medusa payment sessions/orders daily during launch.

## Production activation and refunds

Production activation requires merchant approval, live credentials in a secret manager, registered HTTPS callback domains, allowlisted egress if required, monitoring/alerts, a written refund procedure, and a completed sandbox evidence log. Change sandbox mode through deployment configuration, never by editing source.

The current SSLCOMMERZ provider intentionally does not claim automated refunds. Until the merchant's approved refund API and reconciliation process are implemented, refunds are an authorized manual operation: record the request/order, refund in the merchant portal, verify settlement, and update Medusa/audit state. Never report a refund successful from a browser response alone.

## Adding providers

Create a provider adapter under `apps/medusa/src/modules/payments`, map its states into Medusa payment actions, validate callbacks independently of redirects, define idempotency/retry behavior, add market configuration, and complete integration/reconciliation tests before enabling it in a region.
