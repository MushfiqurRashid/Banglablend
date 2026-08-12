-- Storefront catalogs ("Build a Box" / curated listings). Replaces the nested-product-category
-- hack described in docs/commerce-model.md and docs/superadmin.md with an explicit domain table,
-- per the migration plan's decision to promote metadata-driven patterns into typed schema.

create table storefront_catalogs (
  id uuid primary key default gen_random_uuid(),
  section storefront_section not null,
  handle text not null unique,
  name text not null,
  description text,
  experience catalog_experience not null default 'listing',
  box_size int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storefront_catalogs_box_size_range check (box_size is null or box_size between 2 and 12),
  constraint storefront_catalogs_box_size_matches_experience check (
    (experience = 'build_a_box' and box_size is not null)
    or (experience = 'listing' and box_size is null)
  )
);

create index storefront_catalogs_section_idx on storefront_catalogs (section);

create trigger storefront_catalogs_set_updated_at
  before update on storefront_catalogs
  for each row execute function set_updated_at();

create table storefront_catalog_products (
  catalog_id uuid not null references storefront_catalogs (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  primary key (catalog_id, product_id)
);

create index storefront_catalog_products_product_id_idx on storefront_catalog_products (product_id);
