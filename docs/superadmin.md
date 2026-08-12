# Super Admin operations

The Super Admin owns access, release controls, and operational accountability. Do not share this identity. Invite named staff and assign the least-privilege role that matches their work.

## Initial bootstrap

Apply migrations first, configure Supabase Auth SMTP, and add the final callback URL to the Supabase Auth redirect allowlist:

```text
https://admin.your-domain.com/auth/callback
```

Then run:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='https://PROJECT.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY='...'
$env:NEXT_PUBLIC_ADMIN_URL='https://admin.your-domain.com'
$env:SUPERADMIN_EMAIL='owner@your-domain.com'
$env:SUPERADMIN_FULL_NAME='Account Owner'
pnpm admin:bootstrap
```

Omitting `SUPERADMIN_BOOTSTRAP_PASSWORD` sends an invitation and is the preferred shared/staging/production path. A bootstrap password is supported for controlled local environments only; supply it through the secret manager and rotate it immediately.

## Roles

- **Super Admin:** unrestricted `*:*` access.
- **Catalog Manager:** products, catalogs, prices, and inventory.
- **Order Operations:** order and fulfillment progression.
- **Customer Support:** customer/order context and inquiry triage.
- **Finance / Reconciliation:** order finance, payment evidence, and reports.
- **Read Only:** non-mutating operational visibility.

The panel prevents self-deactivation and prevents removal of the last active Super Admin. After any role change, verify navigation and direct-route behavior with that staff member's session.

## Staff lifecycle

Use **Users & access** to invite a staff member. Supabase sends a one-time link through `/auth/callback` to `/set-password`. Disable access immediately on departure or suspected compromise, then revoke active Supabase sessions from the Auth administration surface when required.

## Routine controls

Daily: failed payments, pending orders, fulfillment exceptions, low stock, new inquiries, and unexpected audit events.

Weekly: staff access, catalog readiness, stale drafts, content verification, callback failures, backups, dependency alerts, and smoke-test evidence.

Before launch or market expansion: payment settlement, shipping rates, tax/duties wording, carrier constraints, returns/refunds, inventory, customer support, legal pages, and human release gates.
