-- Inventory (stock locations + levels) and the two per-product operational records that were
-- Medusa custom modules: product-market (export/logistics eligibility) and product-origin
-- (provenance/traceability). Kept as separate 1:1 tables rather than columns on `products`
-- because they are maintained by a distinct operational workflow with its own verification
-- lifecycle (see docs/superadmin.md source-of-truth table).

create table stock_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_primary boolean not null default false,
  address jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one primary stock location, matching the "primary stock location" the guided product
-- creator and order roadmap both assume.
create unique index stock_locations_single_primary_idx on stock_locations (is_primary) where is_primary;

create trigger stock_locations_set_updated_at
  before update on stock_locations
  for each row execute function set_updated_at();

create table inventory_levels (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  location_id uuid not null references stock_locations (id) on delete restrict,
  stocked_quantity int not null default 0 check (stocked_quantity >= 0),
  reserved_quantity int not null default 0 check (reserved_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_id, location_id)
);

create trigger inventory_levels_set_updated_at
  before update on inventory_levels
  for each row execute function set_updated_at();

create table product_market_details (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references products (id) on delete cascade,
  bangladesh_available boolean not null default true,
  international_available boolean not null default false,
  supported_countries text[] not null default '{}',
  restricted_countries text[] not null default '{}',
  export_ready boolean not null default false,
  domestic_only boolean not null default false,
  shipping_classification text,
  customs_description text,
  country_of_origin text,
  package_dimensions jsonb,
  storage_requirements text,
  temperature_requirements text,
  shelf_life_days int,
  minimum_shelf_life_at_dispatch_days int,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger product_market_details_set_updated_at
  before update on product_market_details
  for each row execute function set_updated_at();

create table product_origin_details (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references products (id) on delete cascade,
  division text,
  district text,
  locality text,
  producer_reference text,
  harvest_date date,
  batch_number text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  verification_status origin_verification_status not null default 'draft',
  evidence_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger product_origin_details_set_updated_at
  before update on product_origin_details
  for each row execute function set_updated_at();
