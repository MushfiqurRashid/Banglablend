-- Orders, fulfillment, and gift details. The `order_display_number` sequence + formatting
-- function port formatBusinessOrderReference() (apps/medusa/src/lib/admin/order-workflow.ts):
-- customer/staff-facing references look like order_01, order_02, ...; the UUID primary key
-- remains the real identifier for URLs, API calls, and audit entries.

create sequence order_display_number_seq start 1;

create table orders (
  id uuid primary key default gen_random_uuid(),
  display_id bigint not null default nextval('order_display_number_seq') unique,
  cart_id uuid references carts (id) on delete set null,
  customer_id uuid references customers (id) on delete set null,
  email citext not null,
  region_id uuid not null references regions (id) on delete restrict,
  currency_code text not null,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'not_paid',
  fulfillment_status fulfillment_status not null default 'not_fulfilled',
  subtotal numeric(12, 2) not null default 0,
  shipping_total numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  is_gift boolean not null default false,
  metadata jsonb not null default '{}',
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_id_idx on orders (customer_id);
create index orders_status_idx on orders (status);
create index orders_payment_status_idx on orders (payment_status);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create or replace function format_business_order_reference(p_display_id bigint)
returns text
language sql
immutable
as $$
  select 'order_' || lpad(p_display_id::text, 2, '0');
$$;

create table order_line_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  variant_id uuid references product_variants (id) on delete set null,
  product_id uuid references products (id) on delete set null,
  title text not null,
  variant_title text,
  thumbnail_url text,
  sku text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  fulfilled_quantity int not null default 0,
  shipped_quantity int not null default 0,
  delivered_quantity int not null default 0,
  created_at timestamptz not null default now()
);

create index order_line_items_order_id_idx on order_line_items (order_id);

create table order_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
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
  unique (order_id, address_type)
);

-- Gift order details. Replaces the `gift_order` Medusa module. Populated at checkout time from
-- the cart's metadata.recipient (see checkoutSchema in packages/validation), then linked to the
-- order once it is placed. cart_id stays unique so re-checking-out the same cart cannot create
-- duplicate gift records (mirrors the subscriber's idempotency check).
create table order_gift_details (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null unique references carts (id) on delete cascade,
  order_id uuid unique references orders (id) on delete set null,
  recipient_name text not null,
  recipient_telephone text not null,
  gift_message text,
  hide_prices boolean not null default false,
  packaging_selection text,
  preferred_delivery_date date,
  delivery_instructions text,
  occasion text,
  corporate_order_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger order_gift_details_set_updated_at
  before update on order_gift_details
  for each row execute function set_updated_at();

create table fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  location_id uuid references stock_locations (id) on delete set null,
  status text not null default 'not_shipped',
  carrier text,
  tracking_number text,
  notified_customer boolean not null default false,
  packed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fulfillments_order_id_idx on fulfillments (order_id);

create trigger fulfillments_set_updated_at
  before update on fulfillments
  for each row execute function set_updated_at();

create table fulfillment_items (
  id uuid primary key default gen_random_uuid(),
  fulfillment_id uuid not null references fulfillments (id) on delete cascade,
  line_item_id uuid not null references order_line_items (id) on delete restrict,
  quantity int not null check (quantity > 0)
);

create index fulfillment_items_fulfillment_id_idx on fulfillment_items (fulfillment_id);
