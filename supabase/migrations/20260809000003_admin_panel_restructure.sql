-- Supports the admin panel navigation restructure: customer tags, a routable id/created_at on
-- homepage_featured_products (so it can go through the generic content editor like every other
-- content table), and a dedicated Reports & Analytics permission.

-- Customers: free-text tags, same denormalized-array precedent as products.badges /
-- recipes.dietary_tags.
alter table customers add column tags text[] not null default '{}';
create index customers_tags_idx on customers using gin (tags);

-- 20260808000013_row_level_security.sql only ever granted staff SELECT on customers
-- ("staff read customers", has_permission('customers','view')) -- there is no staff write
-- policy, so tag edits would be blocked by RLS even for super_admin. Add it, mirroring the
-- "staff manage <table>" policies used elsewhere in that file.
create policy "staff manage customers" on customers for all
  using (has_permission('customers', 'manage')) with check (has_permission('customers', 'manage'));

-- homepage_featured_products has no id/created_at (composite PK on homepage_id+product_id), so it
-- can't be routed through the generic content-registry engine (content/[table]/... assumes a
-- single `id` PK and orders list queries by created_at). Add both; keep the composite uniqueness
-- rule via a separate unique constraint instead of as the primary key.
alter table homepage_featured_products drop constraint homepage_featured_products_pkey;
alter table homepage_featured_products add column id uuid primary key default gen_random_uuid();
alter table homepage_featured_products add column created_at timestamptz not null default now();
alter table homepage_featured_products add constraint homepage_featured_products_unique unique (homepage_id, product_id);

-- Reports & Analytics aggregates orders + catalog + payments + customers, so it's its own
-- concern rather than a subset of any single existing resource -- give it a dedicated resource
-- string. super_admin already has it via '*:*'.
update staff_roles set permissions = permissions || array['reports:view']
  where key in ('read_only', 'finance_reconciliation');
