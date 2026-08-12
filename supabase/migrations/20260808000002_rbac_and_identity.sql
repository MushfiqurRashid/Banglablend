-- RBAC (replaces Medusa's native Admin user/role/policy model) and customer identity
-- (replaces Medusa customer accounts). Both are layered on top of Supabase Auth (auth.users).

-- Staff roles --------------------------------------------------------------------------------
-- permissions is an array of "resource:action" strings, e.g. "catalog:manage", "orders:manage".
-- The wildcard "*:*" grants everything (mirrors Medusa's role_super_admin policy).

create table staff_roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger staff_roles_set_updated_at
  before update on staff_roles
  for each row execute function set_updated_at();

insert into staff_roles (key, name, description, permissions) values
  ('super_admin', 'Super Admin', 'Unrestricted access to every admin surface.', array['*:*']),
  ('catalog_manager', 'Catalog Manager', 'Manage products, catalogs, and market/origin records.',
    array['catalog:view', 'catalog:manage']),
  ('order_operations', 'Order Operations', 'Advance the order roadmap and manage fulfillment.',
    array['orders:view', 'orders:manage']),
  ('customer_support', 'Customer Support', 'View orders and customers, triage inquiries.',
    array['orders:view', 'customers:view', 'inquiries:view', 'inquiries:manage']),
  ('finance_reconciliation', 'Finance / Reconciliation', 'Read-only payment audit and order finance data.',
    array['orders:view', 'payments:view']),
  ('read_only', 'Read Only', 'View-only access across admin surfaces.',
    array['catalog:view', 'orders:view', 'customers:view', 'inquiries:view', 'payments:view', 'content:view']);

-- Staff members --------------------------------------------------------------------------------
-- One row per Supabase Auth user who is staff. auth.users is the credential store; this table is
-- the authorization/profile layer, mirroring how Medusa separated its admin "User" from RBAC role
-- assignment.

create table staff_members (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null,
  full_name text,
  role_id uuid not null references staff_roles (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index staff_members_role_id_idx on staff_members (role_id);

create trigger staff_members_set_updated_at
  before update on staff_members
  for each row execute function set_updated_at();

-- Helper functions used throughout RLS policies -------------------------------------------------

create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff_members sm
    where sm.id = auth.uid() and sm.is_active
  );
$$;

create or replace function staff_permissions()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sr.permissions, '{}')
  from staff_members sm
  join staff_roles sr on sr.id = sm.role_id
  where sm.id = auth.uid() and sm.is_active;
$$;

-- has_permission('catalog', 'manage') checks for an exact "catalog:manage" grant or the "*:*"
-- superadmin wildcard. resource-level wildcards ("catalog:*") are also honored.
create or replace function has_permission(resource text, action text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from unnest(staff_permissions()) as perm
    where perm = '*:*'
       or perm = resource || ':*'
       or perm = resource || ':' || action
  );
$$;

comment on function has_permission(text, text) is
  'RLS helper. Usage: has_permission(''catalog'', ''manage''). Honors "*:*" and "<resource>:*" wildcards.';

-- Customers ------------------------------------------------------------------------------------
-- A customer record is intentionally NOT keyed 1:1 to auth.users: guest checkout creates a
-- customer row with no login (Medusa's own behavior -- the same email can appear on more than
-- one guest order before an account exists), and an account may be created after orders already
-- exist. auth_user_id links a customer to a Supabase Auth login once one exists; it starts null.

create table customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  email citext not null,
  first_name text,
  last_name text,
  phone text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_email_idx on customers (email);

create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

-- Resolves the signed-in Supabase Auth user to their linked customer row, for use in RLS
-- policies (customer_id = current_customer_id()). Returns null for guests / unlinked customers,
-- which correctly denies browser-side access to their records -- those are only ever read/written
-- server-side with the service role key (e.g. right after guest checkout, before account linking).
create or replace function current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from customers where auth_user_id = auth.uid();
$$;

create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  first_name text not null,
  last_name text not null,
  company text,
  address_1 text not null,
  address_2 text,
  city text not null,
  province text,
  postal_code text,
  country_code text not null,
  phone text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_addresses_customer_id_idx on customer_addresses (customer_id);

create trigger customer_addresses_set_updated_at
  before update on customer_addresses
  for each row execute function set_updated_at();
