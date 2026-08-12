# Commerce model

Supabase PostgreSQL owns products, variants, prices, stock, catalogs, carts, shipping, orders, fulfillment, customers, and payment state. RLS protects browser access; trusted storefront and Admin server routes use the service role only where the workflow requires it.

A product groups purchasable variants. Variants own unique SKUs and currency prices. A product has one primary collection and may also belong to multiple storefront catalogs, including Build a Box catalogs. Catalog assignment never overrides price, inventory, market eligibility, verification, or publishing status.

## Markets and prices

Bangladesh uses BDT and the approved domestic shipping/payment methods. International markets stay disabled until product eligibility, local prices, carriers, duties, returns, payment collection, and service levels are approved. Do not convert BDT prices in the browser; each enabled market needs an approved price in its own currency.

Changing destination invalidates an incompatible cart because price, inventory, promotions, shipping, tax, and payment availability may differ.

## Inventory and fulfillment

Every active variant requires a real inventory level at a stock location. `stocked_quantity` is physical stock and `reserved_quantity` is committed but not yet fulfilled; the database prevents reservation from exceeding stock. Publishing readiness requires a positive price and primary-location stock.

Order line items retain title, SKU, quantity, and unit-price snapshots. Creating fulfillment items consumes stock and releases the same reservation in one database transaction. Never edit historical order lines to reflect later catalog changes.

## Cart and order lifecycle

The storefront keeps a cart ID in a secure cookie. Server routes validate variants, market, price, shipping, inventory, addresses, and payment method, and then call restricted database functions. The browser cannot invoke checkout functions directly.

The operational order roadmap is `pending -> processing -> completed`, with cancellation as an explicit terminal path. Payment and fulfillment have separate state machines. Admin reloads the current record before each transition and rejects stale or skipped actions. Customer order routes verify ownership from the authenticated session; a URL ID alone grants no access.

## Gifts

Recipient, message, hidden-price preference, packaging, requested delivery date, and instructions are validated at checkout and retained with the order. The delivery market controls commercial eligibility even when billing and delivery countries differ. Staff manage gift/catalog assignments under **Storefront catalogs**.
