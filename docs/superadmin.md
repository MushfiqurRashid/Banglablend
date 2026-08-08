# Superadmin operations

The superadmin is the accountable owner of Bangla Blend's commerce operations. Use Medusa's
native Admin user, role, and policy model for access control. Do not create a parallel customer
role, a user-metadata flag, or a UI-only permission check and call it authorization.

## Local login

These bootstrap credentials are for local development only:

- Email: `superadmin@banglablend.local`
- Password: `BanglaBlend-Local-Admin-2026!`
- Admin URL: `http://localhost:9000/app`

The password is intentionally documented so a local installation is reproducible. Change it
before another person can reach the environment. Never use this password in a shared, staging, or
production environment. Store deployed credentials in the approved password manager or secret
manager, require a unique password, and rotate immediately after bootstrap or personnel changes.

## Bootstrap and run

From the repository root:

```bash
docker compose up -d postgres redis meilisearch
pnpm db:migrate
pnpm seed:superadmin
pnpm dev:medusa
```

On PowerShell, the same command can be written on one line:

```powershell
pnpm seed:superadmin
```

The idempotent bootstrap command creates or updates the native Medusa Admin identity, attaches the
built-in `role_super_admin`, seeds the typed dashboard settings, and prepares one Bangladesh region,
primary stock location, shipping fulfillment set, country service zone, and the required native
links. It never logs the password and is separate from the catalog seed. It does not create
products, inventory quantities, shipping options, or shipping prices. Production refuses the
documented local credentials and requires explicit `SUPERADMIN_*` values from the deployment secret
manager.

After signing in:

1. Review the bootstrap-created Bangladesh region, primary warehouse, fulfillment set, and service
   zone. Enter the real warehouse address and approve tax, fulfillment, and provider settings.
2. Create approved shipping options and prices in Medusa Admin; the bootstrap deliberately does not
   invent commercial rates.
3. Place the environment's Medusa publishable API key in the storefront's server environment as
   `MEDUSA_PUBLISHABLE_API_KEY`.
4. Run `pnpm seed` only when the clearly marked local sample catalog is wanted.
5. Run `pnpm search:index` after the catalog and verified editorial content are ready.

## Product media storage

The native Medusa product editor uploads, removes, and orders product images. Local development
uses Medusa's built-in local file provider. A deployment switches to the S3 provider only when all
of `S3_FILE_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY` are
configured; partial S3 configuration is ignored so uploads do not fail halfway through setup.
Product titles, descriptions, image alt text, ingredients, storage, shelf life, usage guidance,
badges, market eligibility, and origin data are maintained in the Superadmin catalog workspace and
flow through the commerce adapter to the storefront.

## Collections and storefront catalogs

Use a collection for the product's one primary business destination. Use a storefront catalog when
the same product should appear in an additional curated or customer-facing grouping.

1. Open **Superadmin → Storefront catalogs** (`/app/superadmin/catalogs`).
2. Enter the catalog name and URL handle, select its parent section, and choose either **Product
   listing** or **Build a Box**. A Build a Box catalog also requires the number of products in a
   completed box.
3. Create the catalog. An active Gifts catalog is available at `/gifts/{handle}`; catalogs under
   shop sections are available at `/shop/{section}/{handle}`.
4. Open **Products → Add product** or edit a product in the Superadmin catalog workspace. Select the
   catalog under **Additional storefront catalogs** and save.

Catalogs are backed by nested Medusa product categories and can contain products from several
primary collections. Deactivating a catalog removes it from storefront discovery while retaining
its assignments so it can be restored. Deleting a catalog permanently removes the category and its
product assignments, but never deletes the assigned products, collections, variants, prices,
inventory, orders, or audit evidence. The server validates every assignment and rejects internal,
inactive-on-create, or unmanaged categories.

## Native Medusa RBAC

The application enables Medusa's native RBAC with `MEDUSA_FF_RBAC=true` and explicitly registers
the `@medusajs/medusa/rbac` module in `medusa-config.ts`. Medusa creates `role_super_admin` with the
wildcard `*:*` policy, and `pnpm seed:superadmin` assigns it to the bootstrap identity. For
delegated staff:

1. Go to **Settings → Roles** and define least-privilege operating roles.
2. Assign only the policies needed for catalog, orders, support, finance, or read-only work.
3. Go to **Settings → Users**, assign the appropriate role, then have the user sign out and back in.
4. Verify both the Admin navigation and direct Admin API calls. Hiding a button or route is not
   sufficient; the server must reject an account without the corresponding permission.
5. Give other people least-privilege roles such as Catalog Manager, Order Operations, Customer
   Support, Finance/Reconciliation, and Read Only. Do not share the superadmin login.

If the Roles screen is not available, RBAC is not enabled for that environment. Treat the bootstrap
account as a temporary unrestricted administrator, do not onboard delegated staff, and enable or
provision Medusa's native RBAC before relying on role separation. Do not simulate RBAC with a custom
database column.

## Source-of-truth ownership

| Domain                                                                                                            | Authoritative system                         | Superadmin responsibility                                                  |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| Products, variants, SKUs, images, prices, inventory, categories, collections, promotions, and market eligibility  | Medusa                                       | Create, review, publish, archive, and reconcile commerce records           |
| Customers, carts, orders, payments, shipping, fulfillment, returns, exchanges, refunds, and gift-order operations | Medusa                                       | Use the supported domain actions and preserve financial history            |
| Product-market and product-origin operational records, inquiries, and payment reconciliation views                | Medusa custom modules                        | Maintain verified operational fields and response queues                   |
| Recipes, journal stories, regions, producers, navigation, campaigns, legal pages, and product storytelling        | Sanity Studio                                | Review workflow, provenance, translations, image rights, and publication   |
| Search documents                                                                                                  | Meilisearch                                  | Rebuild from Medusa and verified Sanity records; never edit as source data |
| Secrets, deployment configuration, migrations, backups, and monitoring                                            | Deployment platform and engineering runbooks | Rotate, approve, and verify; never expose in a generic CRUD screen         |

Price, stock, SKU, order, payment, and shipping truth must never be corrected in Sanity. Narrative
copy and editorial evidence must never be stored only in a commerce metadata field when a matching
Sanity schema exists.

## Dashboard data domains

A non-technical operator should see task-oriented sections rather than raw database tables:

- **Overview:** sales and order state, low stock, failed payments, open inquiries, stale content,
  recent changes, and items needing approval.
- **Catalog:** products, variants, options, images, categories, collections, tags, market
  eligibility, prices, inventory, and publish readiness.
- **Sales and operations:** carts, orders, draft orders, payments, fulfillment, returns, exchanges,
  refunds, gift instructions, and shipping exceptions.
- **Customers:** customers, groups, addresses, consent-safe support context, and inquiries.
- **Marketing:** promotions, campaigns, price lists, sales channels, and links to the corresponding
  Sanity campaign or editorial record.
- **Markets and settings:** regions, currencies, tax configuration, fulfillment sets, service
  zones, shipping options, stock locations, API keys, and release gates.
- **Team and security:** users, invites, native roles and policies, sessions or keys that can be
  revoked, and an append-only record of important administrative changes.
- **Content:** deep links and status summaries for Sanity-owned recipes, stories, navigation,
  policies, sourcing evidence, translations, and media.

List views should provide search, filters, sorting, pagination, clear status badges, validation
messages, confirmation for destructive actions, and plain-language empty states. Detail pages
should show related records and the impact of a change before saving it.

## Order operations roadmap

Open **Orders**, select an order, and use the roadmap above the native order detail. The numbered
business reference starts at `order_01`; the longer Medusa ID remains in the URL and is shown for
support diagnostics. The roadmap permits only the next supported action:

1. Confirm the customer, delivery address, item quantities, payment authorization, and gift notes.
2. For Cash on Delivery, treat the payment step as approval to proceed, not proof that cash was
   collected. Reconcile cash against carrier or recipient evidence after delivery.
3. Create fulfillment only when the primary location has the order inventory and packing is ready.
4. Mark shipped only after handing the packed fulfillment to the approved carrier.
5. Mark delivered only after carrier or recipient evidence exists.

Every action runs Medusa's native fulfillment workflow and records an administrator audit entry.
The optional notification switch controls the configured customer notification. Do not use the
roadmap to conceal cancellation, return, exchange, refund, partial fulfillment, payment dispute, or
inventory exceptions; use the matching native workflow so quantities and financial history remain
reconciled.

## Product publishing checklist

For a product to appear in the current storefront, the Medusa record must be published and have:

- a unique handle, approved title and description, at least one sellable variant and SKU;
- thumbnail/gallery images, approved market-specific prices, inventory, sales channel, shipping
  profile, and stock-location relationships;
- `metadata.verified` set to `true`;
- `metadata.is_placeholder` absent or set to `false`;
- `metadata.eligible_markets` containing the active market code, such as `bd`;
- reviewed region, ingredients, storage, shelf-life, badges/tags, and any export restrictions; and
- a linked Sanity product-editorial record when narrative enrichment is required.

After saving, verify the product in the storefront list, product page, cart, and the intended
market. Run the protected search-index job after a catalog release.

## CRUD boundaries and immutable exceptions

"All data in the dashboard" means every maintainable business domain has an organized, authorized
view. It does not mean every database row may be edited or deleted.

The following records must not receive generic edit or delete controls:

- payment callback audits, idempotency keys, payload hashes, and reconciliation evidence;
- captured payment, refund, order, fulfillment, return, exchange, and inventory-movement history;
- append-only administrator audit entries and security events;
- password hashes, auth identities, reset tokens, session secrets, provider credentials, and
  secret API-key values;
- schema migrations, module links, workflow execution state, event-delivery state, and other
  framework-owned records; and
- Meilisearch projections, which must be rebuilt from their source systems.

Use explicit actions such as cancel, refund, return, archive, revoke, rotate, retry, or reconcile.
Those actions must validate the current state, record the responsible user and reason, and preserve
the original evidence. Hard deletion should be limited to legally approved erasure, disposable
drafts, or test data and should require confirmation and an audit record.

## Routine verification

Before handing the dashboard to another operator:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build:medusa
pnpm build:storefront
```

Also test a complete role matrix and a real catalog round trip: create a verified Bangladesh
product with media, price, and stock; confirm it appears in the storefront; edit it; archive it; and
confirm a lower-privilege user cannot perform a forbidden action. Reconcile payment and order
actions through the normal Medusa workflows instead of direct database edits.
