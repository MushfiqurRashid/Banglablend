-- Site-wide singletons and campaign content: siteSettings, homepage (per language), navigation,
-- announcement, promotionBanner, faqItem.

create table site_settings (
  id uuid primary key default gen_random_uuid(),
  -- Enforces "exactly one row" (Sanity's siteSettings is a singleton document).
  is_singleton boolean not null default true unique,
  brand_name text not null default 'Bangla Blend',
  default_seo jsonb,
  support_email citext,
  support_phone text,
  address jsonb,
  social_links jsonb not null default '[]',
  international_checkout_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint site_settings_is_singleton_true check (is_singleton)
);

create trigger site_settings_set_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

insert into site_settings (brand_name) values ('Bangla Blend');

create table homepages (
  id uuid primary key default gen_random_uuid(),
  language content_language not null unique,
  title text not null,
  seo jsonb,
  eyebrow text,
  headline text not null,
  introduction text,
  hero_image jsonb,
  verification_status content_verification_status not null default 'draft',
  verified boolean not null default false,
  verified_at timestamptz,
  source_notes text,
  primary_action jsonb,
  secondary_action jsonb,
  featured_regions uuid[] not null default '{}',
  featured_recipes uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger homepages_set_updated_at
  before update on homepages
  for each row execute function set_updated_at();

create table homepage_featured_products (
  homepage_id uuid not null references homepages (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  sort_order int not null default 0,
  primary key (homepage_id, product_id)
);

create table navigations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  language content_language not null default 'en',
  location navigation_location not null,
  items jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (language, location)
);

create trigger navigations_set_updated_at
  before update on navigations
  for each row execute function set_updated_at();

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  language content_language not null default 'en',
  message text not null,
  link jsonb,
  market banner_market not null default 'all',
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index announcements_active_idx on announcements (active) where active;

create trigger announcements_set_updated_at
  before update on announcements
  for each row execute function set_updated_at();

create table promotion_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  language content_language not null default 'en',
  message text,
  image jsonb,
  action jsonb,
  market banner_market not null default 'all',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index promotion_banners_active_idx on promotion_banners (active) where active;

create trigger promotion_banners_set_updated_at
  before update on promotion_banners
  for each row execute function set_updated_at();

create table faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  language content_language not null default 'en',
  category_id uuid not null references faq_categories (id) on delete cascade,
  answer jsonb not null,
  sort_order int not null default 10,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index faq_items_category_id_idx on faq_items (category_id);
create index faq_items_published_idx on faq_items (published) where published;

create trigger faq_items_set_updated_at
  before update on faq_items
  for each row execute function set_updated_at();
