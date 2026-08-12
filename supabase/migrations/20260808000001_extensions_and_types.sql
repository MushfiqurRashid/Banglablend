-- Bangla Blend | Phase 1 foundation
-- Extensions and shared enum types used across the commerce, operations, and content schemas.

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext" with schema extensions;

-- Product / catalog -----------------------------------------------------------------------

create type product_status as enum ('draft', 'proposed', 'published', 'rejected');

create type gift_type as enum ('corporate', 'set', 'regional');

create type storefront_section as enum (
  'originals',
  'reserve',
  'pantry',
  'tea-wellness',
  'lifestyle-accessories',
  'gifts'
);

create type catalog_experience as enum ('listing', 'build_a_box');

create type market_code as enum ('bd', 'gb', 'us', 'ca', 'eu', 'au', 'me');

create type origin_verification_status as enum ('draft', 'in_review', 'verified', 'rejected');

-- Orders / fulfillment / payments -----------------------------------------------------------

create type order_status as enum ('pending', 'completed', 'archived', 'canceled', 'requires_action');

create type payment_status as enum (
  'not_paid',
  'awaiting',
  'authorized',
  'partially_authorized',
  'captured',
  'partially_captured',
  'partially_refunded',
  'refunded',
  'canceled'
);

create type fulfillment_status as enum (
  'not_fulfilled',
  'partially_fulfilled',
  'fulfilled',
  'partially_shipped',
  'shipped',
  'partially_delivered',
  'delivered',
  'canceled',
  'returned',
  'partially_returned'
);

-- Payment providers are intentionally text (not enum) so new gateways such as bKash, Nagad, or
-- other mobile wallets can be added without a migration. This check constraint is the current
-- whitelist and is safe to extend later.
create domain payment_provider_code as text
  check (value in ('cod', 'sslcommerz', 'bkash', 'nagad', 'wallet'));

-- Operations -------------------------------------------------------------------------------

create type app_setting_value_type as enum ('string', 'number', 'boolean', 'json');

create type inquiry_type as enum ('contact', 'newsletter', 'wholesale', 'corporate');

create type inquiry_status as enum ('new', 'acknowledged', 'in_progress', 'closed');

-- Content / CMS ------------------------------------------------------------------------------

create type content_language as enum ('en', 'bn');

create type content_verification_status as enum ('draft', 'in_review', 'verified', 'archived');

create type banner_market as enum ('all', 'bd', 'gb', 'us');

create type navigation_location as enum ('header', 'footer_shop', 'footer_explore', 'footer_help');

create type recipe_difficulty as enum ('easy', 'moderate', 'advanced');

create type recipe_library_section as enum ('traditional', 'everyday-cooking');

-- Shared helper: keeps updated_at current on any table that has the column.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function set_updated_at() is
  'Row-level trigger: stamps updated_at = now() on every UPDATE. Attach to any table with an updated_at column.';
