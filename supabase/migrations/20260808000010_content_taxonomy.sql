-- Content / CMS foundation tables (replaces Sanity Studio + dataset). This file covers the
-- taxonomy/reference documents other editorial content links to: author, division, region,
-- journalCategory, faqCategory, ingredient.
--
-- Shared object schemas that have no identity of their own (imageWithAlt, callToAction,
-- portableText, seoFields, flavorProfile, addressContent) are stored as jsonb columns rather than
-- separate tables -- they are value objects in the Sanity schema, not references.
--
-- Note: Sanity's "region" document is geography (a place within a division), which would collide
-- with the commerce `regions` table (currency/market). Content geography tables are named
-- geo_divisions / geo_regions to keep the two concepts unambiguous.

create table authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  role text,
  portrait jsonb,
  bio jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger authors_set_updated_at
  before update on authors
  for each row execute function set_updated_at();

create table geo_divisions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  language content_language not null default 'en',
  summary text,
  hero_image jsonb,
  body jsonb,
  verification_status content_verification_status not null default 'draft',
  verified boolean not null default false,
  verified_at timestamptz,
  source_notes text,
  seo jsonb,
  bangla_name text,
  map_coordinates jsonb,
  culinary_notes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, language)
);

create index geo_divisions_verification_idx on geo_divisions (verification_status, verified);

create trigger geo_divisions_set_updated_at
  before update on geo_divisions
  for each row execute function set_updated_at();

create table geo_regions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  language content_language not null default 'en',
  summary text,
  hero_image jsonb,
  body jsonb,
  verification_status content_verification_status not null default 'draft',
  verified boolean not null default false,
  verified_at timestamptz,
  source_notes text,
  seo jsonb,
  division_id uuid not null references geo_divisions (id) on delete restrict,
  coordinates jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, language)
);

create index geo_regions_division_id_idx on geo_regions (division_id);
create index geo_regions_verification_idx on geo_regions (verification_status, verified);

create trigger geo_regions_set_updated_at
  before update on geo_regions
  for each row execute function set_updated_at();

create table journal_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger journal_categories_set_updated_at
  before update on journal_categories
  for each row execute function set_updated_at();

create table faq_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  sort_order int not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger faq_categories_set_updated_at
  before update on faq_categories
  for each row execute function set_updated_at();

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  language content_language not null default 'en',
  summary text,
  hero_image jsonb,
  body jsonb,
  verification_status content_verification_status not null default 'draft',
  verified boolean not null default false,
  verified_at timestamptz,
  source_notes text,
  seo jsonb,
  bangla_name text,
  flavor jsonb,
  origin_division_id uuid references geo_divisions (id) on delete set null,
  origin_region_id uuid references geo_regions (id) on delete set null,
  allergen_statement text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, language)
);

create index ingredients_verification_idx on ingredients (verification_status, verified);

create trigger ingredients_set_updated_at
  before update on ingredients
  for each row execute function set_updated_at();

-- Join tables for geo_region curation lists (real FKs, replacing Sanity's soft array references).
create table region_signature_ingredients (
  region_id uuid not null references geo_regions (id) on delete cascade,
  ingredient_id uuid not null references ingredients (id) on delete cascade,
  sort_order int not null default 0,
  primary key (region_id, ingredient_id)
);

create table region_featured_products (
  region_id uuid not null references geo_regions (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  sort_order int not null default 0,
  primary key (region_id, product_id)
);
