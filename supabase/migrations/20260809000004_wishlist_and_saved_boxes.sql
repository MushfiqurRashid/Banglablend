-- Customer wishlist and saved gift-box selections, supporting the rebuilt account dashboard.
-- saved_box_items is a child of saved_boxes (not customers directly), so its RLS uses the
-- EXISTS-through-parent pattern already used for order_line_items/order_addresses.

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);
create index wishlist_items_customer_id_idx on wishlist_items (customer_id);

create table saved_boxes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  catalog_id uuid not null references storefront_catalogs (id) on delete cascade,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index saved_boxes_customer_id_idx on saved_boxes (customer_id);
create trigger saved_boxes_set_updated_at before update on saved_boxes
  for each row execute function set_updated_at();

create table saved_box_items (
  id uuid primary key default gen_random_uuid(),
  saved_box_id uuid not null references saved_boxes (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (saved_box_id, product_id)
);
create index saved_box_items_saved_box_id_idx on saved_box_items (saved_box_id);

alter table wishlist_items enable row level security;
alter table saved_boxes enable row level security;
alter table saved_box_items enable row level security;

create policy "customers manage own wishlist" on wishlist_items for all
  using (customer_id = current_customer_id()) with check (customer_id = current_customer_id());
create policy "staff read wishlists" on wishlist_items for select using (has_permission('customers', 'view'));

create policy "customers manage own saved boxes" on saved_boxes for all
  using (customer_id = current_customer_id()) with check (customer_id = current_customer_id());
create policy "staff read saved boxes" on saved_boxes for select using (has_permission('customers', 'view'));

create policy "customers manage own saved box items" on saved_box_items for all
  using (exists (select 1 from saved_boxes b where b.id = saved_box_id and b.customer_id = current_customer_id()))
  with check (exists (select 1 from saved_boxes b where b.id = saved_box_id and b.customer_id = current_customer_id()));
create policy "staff read saved box items" on saved_box_items for select using (has_permission('customers', 'view'));
