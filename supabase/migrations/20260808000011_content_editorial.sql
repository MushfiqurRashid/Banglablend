-- Editorial content: people (farmer, producer), narrative documents (sourcingStory,
-- productEditorial, giftEditorial, recipe, journalArticle), and plain pages (standardPage,
-- legalPage). All carry the shared verification lifecycle (draft -> in_review -> verified ->
-- archived) per docs/content-model.md; storefront reads must always filter on
-- verification_status = 'verified' and verified = true, same as the old GROQ queries did.

create table farmers (
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
  display_name text not null,
  location_division_id uuid references geo_divisions (id) on delete set null,
  location_region_id uuid references geo_regions (id) on delete set null,
  consent_recorded boolean not null default false,
  consent_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, language),
  constraint farmers_require_consent check (consent_recorded is true or verification_status <> 'verified')
);

create index farmers_verification_idx on farmers (verification_status, verified);

create trigger farmers_set_updated_at
  before update on farmers
  for each row execute function set_updated_at();

create table producers (
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
  display_name text not null,
  location_division_id uuid references geo_divisions (id) on delete set null,
  location_region_id uuid references geo_regions (id) on delete set null,
  certifications text[] not null default '{}',
  consent_recorded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, language)
);

create index producers_verification_idx on producers (verification_status, verified);

create trigger producers_set_updated_at
  before update on producers
  for each row execute function set_updated_at();

create table sourcing_stories (
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
  ingredient_id uuid references ingredients (id) on delete set null,
  place_division_id uuid references geo_divisions (id) on delete set null,
  place_region_id uuid references geo_regions (id) on delete set null,
  harvest_window text,
  traceability_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, language)
);

create index sourcing_stories_verification_idx on sourcing_stories (verification_status, verified);

create trigger sourcing_stories_set_updated_at
  before update on sourcing_stories
  for each row execute function set_updated_at();

create table sourcing_story_farmers (
  story_id uuid not null references sourcing_stories (id) on delete cascade,
  farmer_id uuid not null references farmers (id) on delete cascade,
  sort_order int not null default 0,
  primary key (story_id, farmer_id)
);

create table sourcing_story_producers (
  story_id uuid not null references sourcing_stories (id) on delete cascade,
  producer_id uuid not null references producers (id) on delete cascade,
  sort_order int not null default 0,
  primary key (story_id, producer_id)
);

-- Product editorial: narrative enrichment keyed to a real product (was a loose
-- `medusaProductId` string in Sanity; now a proper foreign key).
create table product_editorials (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  language content_language not null default 'en',
  editorial_title text not null,
  short_story text,
  story jsonb,
  origin_division_id uuid references geo_divisions (id) on delete set null,
  origin_region_id uuid references geo_regions (id) on delete set null,
  flavor jsonb,
  usage_notes jsonb,
  gallery jsonb,
  verification_status content_verification_status not null default 'draft',
  verified boolean not null default false,
  verified_at timestamptz,
  source_notes text,
  seo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, language)
);

create index product_editorials_verification_idx on product_editorials (verification_status, verified);

create trigger product_editorials_set_updated_at
  before update on product_editorials
  for each row execute function set_updated_at();

create table product_editorial_farmers (
  editorial_id uuid not null references product_editorials (id) on delete cascade,
  farmer_id uuid not null references farmers (id) on delete cascade,
  sort_order int not null default 0,
  primary key (editorial_id, farmer_id)
);

create table gift_editorials (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  language content_language not null default 'en',
  title text not null,
  occasion text[] not null default '{}',
  contents text[] not null default '{}',
  story jsonb,
  gallery jsonb,
  personalisation_available boolean not null default true,
  verification_status content_verification_status not null default 'draft',
  verified boolean not null default false,
  verified_at timestamptz,
  source_notes text,
  seo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, language)
);

create index gift_editorials_verification_idx on gift_editorials (verification_status, verified);

create trigger gift_editorials_set_updated_at
  before update on gift_editorials
  for each row execute function set_updated_at();

create table recipes (
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
  author_id uuid references authors (id) on delete set null,
  region_division_id uuid references geo_divisions (id) on delete set null,
  region_region_id uuid references geo_regions (id) on delete set null,
  servings int not null check (servings > 0),
  prep_minutes int check (prep_minutes >= 0),
  cook_minutes int check (cook_minutes >= 0),
  difficulty recipe_difficulty,
  library_sections recipe_library_section[] not null default '{}',
  dietary_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, language)
);

create index recipes_verification_idx on recipes (verification_status, verified);

create trigger recipes_set_updated_at
  before update on recipes
  for each row execute function set_updated_at();

create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  ingredient_id uuid not null references ingredients (id) on delete restrict,
  amount numeric(10, 2) check (amount > 0),
  unit text,
  imperial_amount numeric(10, 2) check (imperial_amount > 0),
  imperial_unit text,
  note text,
  sort_order int not null default 0
);

create index recipe_ingredients_recipe_id_idx on recipe_ingredients (recipe_id);

create table recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  sort_order int not null default 0,
  instruction text not null,
  image jsonb,
  timer_minutes int check (timer_minutes > 0)
);

create index recipe_steps_recipe_id_idx on recipe_steps (recipe_id);

create table recipe_related_products (
  recipe_id uuid not null references recipes (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  sort_order int not null default 0,
  primary key (recipe_id, product_id)
);

create table journal_articles (
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
  author_id uuid not null references authors (id) on delete restrict,
  category_id uuid not null references journal_categories (id) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, language)
);

create index journal_articles_verification_idx on journal_articles (verification_status, verified);
create index journal_articles_category_id_idx on journal_articles (category_id);

create trigger journal_articles_set_updated_at
  before update on journal_articles
  for each row execute function set_updated_at();

-- Surrogate primary key (not a composite of article/division/region) because region_id is
-- nullable -- regionReference requires a division but region is optional, and PRIMARY KEY columns
-- cannot be nullable.
create table journal_article_places (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references journal_articles (id) on delete cascade,
  division_id uuid not null references geo_divisions (id) on delete cascade,
  region_id uuid references geo_regions (id) on delete cascade,
  sort_order int not null default 0
);

create index journal_article_places_article_id_idx on journal_article_places (article_id);

create table journal_article_related_products (
  article_id uuid not null references journal_articles (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  sort_order int not null default 0,
  primary key (article_id, product_id)
);

create table standard_pages (
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, language)
);

create index standard_pages_verification_idx on standard_pages (verification_status, verified);

create trigger standard_pages_set_updated_at
  before update on standard_pages
  for each row execute function set_updated_at();

create table legal_pages (
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
  effective_date date not null,
  review_owner text,
  legal_approval_recorded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, language),
  constraint legal_pages_require_approval check (
    legal_approval_recorded is true or verification_status <> 'verified'
  )
);

create index legal_pages_verification_idx on legal_pages (verification_status, verified);

create trigger legal_pages_set_updated_at
  before update on legal_pages
  for each row execute function set_updated_at();
