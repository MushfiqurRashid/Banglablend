# Administration

Admin runs as a separate private Next.js service. Staff authenticate with Supabase Auth at `/login`; navigation and controls are filtered by the permissions stored in `staff_roles`, and PostgreSQL RLS remains the final authorization boundary.

## Daily workspace

- **Overview:** live operational counts, recent administrator activity, and catalog-readiness exceptions.
- **Commerce:** orders, products, storefront catalogs, and inventory.
- **Relationships:** customers, tags, addresses, order history, and inquiry triage.
- **Storefront:** homepage sections, pages, navigation, promotions, recipes, stories, and content verification.
- **Insight and control:** reports, append-only payment evidence, and administrator activity.
- **Administration:** staff invitations, role assignment, account status, and typed application settings.

Lists provide search, filters, result counts, pagination, stable status badges, and useful empty states. Management-only routes redirect unauthorized staff to the overview; read-only detail views disable mutation controls.

## Product release

Before publishing a product, confirm:

1. Title, handle, reviewed description, image, alt text, and primary collection are complete.
2. Every active variant has a unique SKU, positive BDT price, and primary-location inventory.
3. Eligible markets, storage, shelf life, ingredients, usage notes, and gift classification are reviewed.
4. `verified=true`, `is_placeholder=false`, and `status=published` are appropriate.
5. The storefront product page, cart, and intended market have been checked.

Archiving removes a product from storefront discovery while preserving historical order references.

## Orders

The order roadmap is **placed -> payment/COD approval -> packed -> shipped -> delivered**. The server action reloads current state before every transition; stale or crafted requests cannot skip a step. Online orders require authorized or captured payment. Fulfillment consumes primary-location stock through a database trigger in the same transaction that creates fulfillment items.

`order_01`, `order_02`, and similar values are stable business references. UUIDs remain the immutable relation and URL identifiers.

## Content

Factual content follows `draft -> in_review -> verified -> archived`. Public RLS policies expose only verified records. Publishing calls the storefront's signed revalidation route. Legal approval, citations, consent, translations, image rights, and factual claims still require accountable human review.

## Immutable evidence

Payment audits and administrator audit entries are append-only. Do not add generic edit or delete controls for payment callbacks, orders, fulfillment history, inventory movements, auth identities, secrets, migrations, or derived caches. Use explicit operational actions that retain original evidence.
