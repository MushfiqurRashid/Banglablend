# Administration

## Commerce operations

The custom backend contract can be explored through Swagger UI at `/docs` on the Medusa backend. Use `/openapi.json` for code generation and automated contract checks. Public inquiry endpoints can be tested directly; Admin endpoints require authentication through Swagger's **Authorize** control.

Use Medusa Admin for product/variant identity, SKUs, collections/categories, regional prices, inventory locations and levels, shipping options, promotions, customers, orders, fulfillment, cancellations, and refunds. The Bangla Blend Admin route links the operational areas; the order widget surfaces gift metadata.

Before publishing a product:

- replace all placeholder descriptions/metadata and remove `isPlaceholder` only after review;
- attach every sellable variant to approved prices, inventory, sales channels, shipping profiles, and eligible markets;
- confirm ingredient/allergen/storage/shelf-life text against packaging and legal requirements;
- verify export and carrier constraints separately for every international destination;
- connect its stable Medusa product ID/handle to the matching Sanity editorial document.

Never correct price, inventory, order, or payment state in Sanity. Never add a purchasable product only in Sanity.

## Orders and gifts

Check payment status before fulfillment. A gateway redirect is not proof of payment. For COD, follow the approved carrier/collection process. For gifts, review recipient address, message, price-hiding preference, packaging, requested date, and instructions; do not expose buyer billing details to the recipient. Use role-based access and leave audit context for manual changes.

The order detail page includes an operational roadmap: **Order placed -> COD approved/payment verified -> Packed/fulfilled -> Shipped -> Delivered**. The next button runs Medusa's native domain workflow and cannot skip a stage. Creating fulfillment allocates the order items from the primary stock location, shipment records carrier handoff, and delivery requires an existing shipment. Customer notifications can be disabled when no configured channel should send them. Cancellations, returns, partial returns, refunds, and payment exceptions remain visible as exception paths and must use their supported Medusa actions.

Operators and customers see the stable business reference `order_01`, `order_02`, and so on, derived from Medusa's database sequence. The opaque ID such as `order_01K...` remains the immutable identifier used by URLs, API calls, relations, and audit records. Never rewrite internal IDs to make them shorter, and never reuse a business reference after cancellation or deletion.

## Content operations

Use Sanity Studio for narrative content, navigation, campaigns, recipes, places, sourcing profiles, policies, and product/gift storytelling. Draft → in review → verified is mandatory for factual material. Record citations/consent internally, require alt text, and check both language variants. Legal pages require their approval flag and effective date.

Publishing triggers cache revalidation only when the webhook is correctly signed. Run the protected `pnpm search:index` job after a verified content or catalog release and test English, Bangla, and transliterated queries. If search is stale, the source systems remain authoritative: repair/rebuild the index rather than editing it manually.

## Routine checks

Daily during launch: failed orders/payments, duplicate/rejected callback audits, unfulfilled orders, inventory exceptions, inquiry response queues, and search health. Weekly: prices/promotions, stale drafts, content verification dates, webhook failures, dependency/security alerts, and backup results. Before every market expansion, repeat the export, payment, tax/duties wording, returns, shipping, inventory, and customer-support readiness review.
