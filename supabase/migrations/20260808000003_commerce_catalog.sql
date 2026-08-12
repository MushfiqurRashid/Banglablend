-- Core commerce catalog: regions, collections, products, variants, options.
-- Replaces Medusa's product/variant/option/region/collection tables. Fields that used to live in
-- Medusa's untyped `product.metadata` JSON (region, ingredients, storage, shelf_life, usage,
-- eligible_markets, badges, best_seller, verified, is_placeholder, thumbnail_alt, gift_type) are
-- promoted to explicit typed columns here, per docs/commerce-model.md and the guided product
-- creator's metadata contract (apps/medusa/src/lib/admin/product-create.ts).

create table regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency_code text not null,
  market_code market_code not null unique,
  is_domestic boolean not null default false,
  tax_rate numeric(6, 4) not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger regions_set_updated_at
  before update on regions
  for each row execute function set_updated_at();

create table product_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  handle storefront_section not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger product_collections_set_updated_at
  before update on product_collections
  for each row execute function set_updated_at();

create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  handle text not null unique,
  subtitle text,
  description text,
  status product_status not null default 'draft',
  thumbnail_url text,
  thumbnail_alt text,
  collection_id uuid not null references product_collections (id) on delete restrict,
  gift_type gift_type,
  region text,
  ingredients text,
  storage text,
  shelf_life text,
  usage_notes text,
  eligible_markets market_code[] not null default '{}',
  badges text[] not null default '{}',
  best_seller boolean not null default false,
  is_placeholder boolean not null default false,
  verified boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- gift_type validity (only set when collection.handle = 'gifts') is enforced by the
-- enforce_product_gift_type trigger below rather than a CHECK constraint, because the rule spans
-- two tables (it depends on the referenced collection's handle).
create index products_collection_id_idx on products (collection_id) where deleted_at is null;
create index products_status_idx on products (status) where deleted_at is null;
create index products_verified_idx on products (verified) where deleted_at is null;
create index products_eligible_markets_idx on products using gin (eligible_markets);

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

create or replace function enforce_product_gift_type()
returns trigger
language plpgsql
as $$
declare
  collection_handle storefront_section;
begin
  select handle into collection_handle from product_collections where id = new.collection_id;

  if collection_handle = 'gifts' and new.gift_type is null then
    raise exception 'Choose a gift_type (corporate, set, or regional) for a product in the Gifts collection.';
  end if;
  if collection_handle <> 'gifts' and new.gift_type is not null then
    raise exception 'gift_type is only valid for products in the Gifts collection.';
  end if;
  return new;
end;
$$;

create trigger products_enforce_gift_type
  before insert or update on products
  for each row execute function enforce_product_gift_type();

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on product_images (product_id);

create table product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  unique (product_id, title)
);

create table product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references product_options (id) on delete cascade,
  value text not null,
  created_at timestamptz not null default now(),
  unique (option_id, value)
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  title text not null,
  sku text not null unique,
  manage_inventory boolean not null default true,
  -- Denormalized option selections, e.g. {"Size": "250g"}. Mirrors the guided product creator's
  -- simple single-option ("Size") pattern; normalize into a join table if multi-option variants
  -- are introduced later.
  option_values jsonb not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index product_variants_product_id_idx on product_variants (product_id) where deleted_at is null;

create trigger product_variants_set_updated_at
  before update on product_variants
  for each row execute function set_updated_at();

create table product_prices (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  region_id uuid references regions (id) on delete restrict,
  currency_code text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_id, currency_code)
);

create trigger product_prices_set_updated_at
  before update on product_prices
  for each row execute function set_updated_at();
