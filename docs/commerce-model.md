# Commerce model

Medusa owns transactional state. A product groups one or more purchasable variants; variants own SKUs, option values, prices, and inventory relationships. Collections provide the storefront taxonomy: Originals, Reserve, Pantry, Tea & Wellness, Lifestyle Accessories, and Gifts. Categories may be added for merchandising without changing editorial schemas.

## Markets, prices, and eligibility

The Bangladesh region uses BDT and domestic shipping/payment methods. Initial sample international regions use GBP and USD but remain operationally disabled until export eligibility, carriers, duties wording, payment provider, returns, and service levels are approved. `product-market` records and product metadata express eligible markets; backend region and price rules remain authoritative.

Do not convert a BDT display price in the browser. Each enabled region needs an approved price list in its own currency. A destination change invalidates the current cart because region, inventory, promotions, tax, shipping, and payment availability may all change.

## Inventory and fulfillment

Production variants should use inventory items and stock locations. Domestic chilled/fresh products must only attach to supported Bangladesh shipping/service zones. Exportable ambient products must be explicitly approved per destination. Overselling, backorders, preorder rules, and safety-stock thresholds are operational decisions configured in Medusa, not UI assumptions.

The included catalog seed disables inventory management only for visibly marked sample variants so a fresh development install can render. Replace these fixtures with verified products, locations, inventory levels, and shipping options before acceptance testing.

## Cart, promotions, and orders

A cart belongs to one region/market. The Next.js server keeps its ID in a secure cookie, while all price totals are recalculated by Medusa. Quantity updates and promotions must pass inventory and eligibility checks. Checkout adds addresses, selects a backend-provided shipping option, creates a payment collection/session, then completes the cart into an order.

Order state is authoritative in Medusa. Email and fulfillment integrations subscribe to order events. Account pages query customer-owned orders using the server-held auth token; an order ID in a URL is never authorization by itself.

## Gifts

Gift fields—recipient, message, hidden prices, packaging preference, delivery date, and instructions—are captured by validated checkout input and stored in order metadata. The gift workflow projects them into a dedicated `gift-order` module record for operations. Billing and delivery countries may differ; the selected delivery market controls product and shipping eligibility.
