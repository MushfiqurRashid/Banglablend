-- Shipping options, carts, and checkout state. A cart belongs to exactly one region (per
-- docs/commerce-model.md: "A cart belongs to one region/market"); switching destination
-- invalidates the cart rather than converting its prices client-side.

create table shipping_options (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references regions (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency_code text not null,
  provider text not null default 'manual',
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipping_options_region_id_idx on shipping_options (region_id) where is_active;

create trigger shipping_options_set_updated_at
  before update on shipping_options
  for each row execute function set_updated_at();

create table carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers (id) on delete set null,
  region_id uuid not null references regions (id) on delete restrict,
  email citext,
  currency_code text not null,
  -- Transient checkout-only data (e.g. gift recipient captured before order placement, matching
  -- the storefront's checkoutSchema.recipient). Once an order is placed this is projected into
  -- order_gift_details, which is the durable operational record.
  metadata jsonb not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index carts_customer_id_idx on carts (customer_id) where completed_at is null;

create trigger carts_set_updated_at
  before update on carts
  for each row execute function set_updated_at();

create table cart_line_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts (id) on delete cascade,
  variant_id uuid not null references product_variants (id) on delete restrict,
  product_id uuid not null references products (id) on delete restrict,
  title text not null,
  variant_title text,
  thumbnail_url text,
  quantity int not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  currency_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create trigger cart_line_items_set_updated_at
  before update on cart_line_items
  for each row execute function set_updated_at();

create table cart_addresses (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts (id) on delete cascade,
  address_type text not null check (address_type in ('shipping', 'billing')),
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
  created_at timestamptz not null default now(),
  unique (cart_id, address_type)
);

create table cart_shipping_methods (
  cart_id uuid primary key references carts (id) on delete cascade,
  shipping_option_id uuid not null references shipping_options (id) on delete restrict,
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);
