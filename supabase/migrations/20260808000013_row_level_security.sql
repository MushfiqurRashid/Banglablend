-- Row Level Security. Replaces Medusa's native Admin RBAC + the storefront's server-only API
-- proxy pattern. Two access paths exist by design:
--   1. Trusted server code (Next.js route handlers in apps/storefront and apps/admin) uses the
--      Supabase *service role* key, which bypasses RLS entirely -- this is where cart/checkout/
--      order-writing logic lives, mirroring how the old storefront never let the browser talk to
--      Medusa directly for money-moving operations.
--   2. Browser/client code uses the anon or authenticated Supabase key and is governed by the
--      policies below: public catalog/content reads, a customer's own account data, and staff
--      admin-app access gated by has_permission().
--
-- Enable RLS on every table in one pass so nothing is accidentally left open.
do $$
declare
  t record;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- Staff / RBAC -----------------------------------------------------------------------------

create policy "staff can read roles" on staff_roles for select using (is_staff());
create policy "staff can manage roles" on staff_roles for all
  using (has_permission('staff', 'manage')) with check (has_permission('staff', 'manage'));

create policy "staff can read staff members" on staff_members for select using (is_staff());
create policy "staff can manage staff members" on staff_members for all
  using (has_permission('staff', 'manage')) with check (has_permission('staff', 'manage'));

-- Customers ----------------------------------------------------------------------------------

create policy "customers read own profile" on customers for select using (auth_user_id = auth.uid());
create policy "customers update own profile" on customers for update
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy "staff read customers" on customers for select using (has_permission('customers', 'view'));

create policy "customers manage own addresses" on customer_addresses for all
  using (customer_id = current_customer_id()) with check (customer_id = current_customer_id());
create policy "staff read customer addresses" on customer_addresses for select
  using (has_permission('customers', 'view'));

-- Commerce catalog: public read of published/verified data, staff manage everything ----------

create policy "public read active regions" on regions for select using (is_active);
create policy "staff manage regions" on regions for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

create policy "public read collections" on product_collections for select using (true);
create policy "staff manage collections" on product_collections for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

create policy "public read published products" on products for select
  using (status = 'published' and verified and deleted_at is null);
create policy "staff read all products" on products for select using (has_permission('catalog', 'view'));
create policy "staff manage products" on products for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

-- Child catalog tables inherit visibility from their parent product via EXISTS checks.
create policy "public read images of visible products" on product_images for select
  using (exists (
    select 1 from products p
    where p.id = product_images.product_id and p.status = 'published' and p.verified and p.deleted_at is null
  ));
create policy "staff manage product images" on product_images for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

create policy "public read product options" on product_options for select using (true);
create policy "staff manage product options" on product_options for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

create policy "public read product option values" on product_option_values for select using (true);
create policy "staff manage product option values" on product_option_values for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

create policy "public read variants of visible products" on product_variants for select
  using (exists (
    select 1 from products p
    where p.id = product_variants.product_id and p.status = 'published' and p.verified and p.deleted_at is null
  ));
create policy "staff manage variants" on product_variants for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

create policy "public read prices of visible variants" on product_prices for select
  using (exists (
    select 1 from product_variants v
    join products p on p.id = v.product_id
    where v.id = product_prices.variant_id and p.status = 'published' and p.verified and p.deleted_at is null
  ));
create policy "staff manage prices" on product_prices for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

create policy "staff read inventory" on inventory_levels for select using (has_permission('catalog', 'view'));
create policy "staff manage inventory" on inventory_levels for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));
create policy "staff manage stock locations" on stock_locations for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

create policy "staff manage product market details" on product_market_details for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));
create policy "staff manage product origin details" on product_origin_details for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

-- Storefront catalogs ------------------------------------------------------------------------

create policy "public read active catalogs" on storefront_catalogs for select using (is_active);
create policy "staff manage catalogs" on storefront_catalogs for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

create policy "public read catalog assignments" on storefront_catalog_products for select
  using (exists (select 1 from storefront_catalogs c where c.id = catalog_id and c.is_active));
create policy "staff manage catalog assignments" on storefront_catalog_products for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

create policy "public read active shipping options" on shipping_options for select using (is_active);
create policy "staff manage shipping options" on shipping_options for all
  using (has_permission('catalog', 'manage')) with check (has_permission('catalog', 'manage'));

-- Carts: browser access is limited to a signed-in customer's own cart. Guest-cart and checkout
-- writes happen server-side with the service role key (bypasses RLS), matching the old
-- "Next.js server keeps the cart id in a secure cookie" pattern in docs/commerce-model.md.

create policy "customers manage own carts" on carts for all
  using (customer_id = current_customer_id()) with check (customer_id = current_customer_id());

create policy "customers manage own cart items" on cart_line_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.customer_id = current_customer_id()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.customer_id = current_customer_id()));

create policy "customers manage own cart addresses" on cart_addresses for all
  using (exists (select 1 from carts c where c.id = cart_id and c.customer_id = current_customer_id()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.customer_id = current_customer_id()));

create policy "customers manage own cart shipping method" on cart_shipping_methods for all
  using (exists (select 1 from carts c where c.id = cart_id and c.customer_id = current_customer_id()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.customer_id = current_customer_id()));

-- Orders: customers read their own order history; all writes are server-side (service role)
-- through the order-placement and order-roadmap routes so status transitions stay centralized.

create policy "customers read own orders" on orders for select using (customer_id = current_customer_id());
create policy "staff read orders" on orders for select using (has_permission('orders', 'view'));
create policy "staff manage orders" on orders for all
  using (has_permission('orders', 'manage')) with check (has_permission('orders', 'manage'));

create policy "customers read own order items" on order_line_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = current_customer_id()));
create policy "staff read order items" on order_line_items for select using (has_permission('orders', 'view'));
create policy "staff manage order items" on order_line_items for all
  using (has_permission('orders', 'manage')) with check (has_permission('orders', 'manage'));

create policy "customers read own order addresses" on order_addresses for select
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = current_customer_id()));
create policy "staff manage order addresses" on order_addresses for all
  using (has_permission('orders', 'manage')) with check (has_permission('orders', 'manage'));

create policy "customers read own gift details" on order_gift_details for select
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = current_customer_id()));
create policy "staff manage gift details" on order_gift_details for all
  using (has_permission('orders', 'manage')) with check (has_permission('orders', 'manage'));

create policy "customers read own fulfillments" on fulfillments for select
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = current_customer_id()));
create policy "staff manage fulfillments" on fulfillments for all
  using (has_permission('orders', 'manage')) with check (has_permission('orders', 'manage'));

create policy "customers read own fulfillment items" on fulfillment_items for select
  using (exists (
    select 1 from fulfillments f join orders o on o.id = f.order_id
    where f.id = fulfillment_id and o.customer_id = current_customer_id()
  ));
create policy "staff manage fulfillment items" on fulfillment_items for all
  using (has_permission('orders', 'manage')) with check (has_permission('orders', 'manage'));

-- Payments: no direct customer access (the customer-visible payment state is orders.payment_status).

create policy "staff read payment collections" on payment_collections for select using (has_permission('payments', 'view'));
create policy "staff manage payment collections" on payment_collections for all
  using (has_permission('orders', 'manage')) with check (has_permission('orders', 'manage'));

create policy "staff read payment sessions" on payment_sessions for select using (has_permission('payments', 'view'));
create policy "staff manage payment sessions" on payment_sessions for all
  using (has_permission('orders', 'manage')) with check (has_permission('orders', 'manage'));

create policy "staff read payments" on payments for select using (has_permission('payments', 'view'));
create policy "staff manage payments" on payments for all
  using (has_permission('orders', 'manage')) with check (has_permission('orders', 'manage'));

create policy "staff read payment audits" on payment_audits for select using (has_permission('payments', 'view'));
-- No insert/update/delete policy for payment_audits: rows are written exclusively by the IPN
-- webhook handler using the service role key (bypasses RLS), and update/delete are additionally
-- blocked by the forbid_mutation triggers regardless of role.

-- Operations modules --------------------------------------------------------------------------

create policy "staff read audit log" on admin_audit_log for select using (is_staff());
-- No insert/update/delete policy: written by trusted server code via the service role key;
-- update/delete are blocked outright by the forbid_mutation triggers.

create policy "public read public settings" on app_settings for select
  using (is_public and not is_secret);
create policy "staff read all settings" on app_settings for select using (has_permission('settings', 'manage'));
create policy "staff manage settings" on app_settings for all
  using (has_permission('settings', 'manage')) with check (has_permission('settings', 'manage'));

-- Inquiries: anyone can submit one (storefront contact/wholesale/corporate/newsletter forms);
-- only staff can triage. The insert check pins new rows to status='new' with no staff-only
-- fields set, so a public submission can never self-assign or pre-fill internal notes.
create policy "public can submit inquiries" on inquiries for insert
  with check (status = 'new' and assigned_staff_id is null and internal_notes is null);
create policy "staff read inquiries" on inquiries for select using (has_permission('inquiries', 'view'));
create policy "staff manage inquiries" on inquiries for update
  using (has_permission('inquiries', 'manage')) with check (has_permission('inquiries', 'manage'));

-- Content / CMS: public read requires the verified flag; staff with content:manage can read/write
-- everything. Reference/taxonomy tables without a verification lifecycle (author, journalCategory,
-- faqCategory) are public-readable outright, matching their Sanity schemas.

create policy "public read authors" on authors for select using (true);
create policy "staff manage authors" on authors for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read journal categories" on journal_categories for select using (true);
create policy "staff manage journal categories" on journal_categories for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read faq categories" on faq_categories for select using (true);
create policy "staff manage faq categories" on faq_categories for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read published faq items" on faq_items for select using (published);
create policy "staff manage faq items" on faq_items for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read site settings" on site_settings for select using (true);
create policy "staff manage site settings" on site_settings for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read active announcements" on announcements for select using (active);
create policy "staff manage announcements" on announcements for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read active promotion banners" on promotion_banners for select using (active);
create policy "staff manage promotion banners" on promotion_banners for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read navigations" on navigations for select using (true);
create policy "staff manage navigations" on navigations for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

-- Generic "verified content" policy, applied per table below.
create policy "public read verified geo divisions" on geo_divisions for select
  using (verification_status = 'verified' and verified);
create policy "staff manage geo divisions" on geo_divisions for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified geo regions" on geo_regions for select
  using (verification_status = 'verified' and verified);
create policy "staff manage geo regions" on geo_regions for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read region signature ingredients" on region_signature_ingredients for select
  using (exists (select 1 from geo_regions r where r.id = region_id and r.verification_status = 'verified' and r.verified));
create policy "staff manage region signature ingredients" on region_signature_ingredients for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read region featured products" on region_featured_products for select
  using (exists (select 1 from geo_regions r where r.id = region_id and r.verification_status = 'verified' and r.verified));
create policy "staff manage region featured products" on region_featured_products for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified ingredients" on ingredients for select
  using (verification_status = 'verified' and verified);
create policy "staff manage ingredients" on ingredients for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified farmers" on farmers for select
  using (verification_status = 'verified' and verified);
create policy "staff manage farmers" on farmers for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified producers" on producers for select
  using (verification_status = 'verified' and verified);
create policy "staff manage producers" on producers for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified sourcing stories" on sourcing_stories for select
  using (verification_status = 'verified' and verified);
create policy "staff manage sourcing stories" on sourcing_stories for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read sourcing story farmers" on sourcing_story_farmers for select
  using (exists (select 1 from sourcing_stories s where s.id = story_id and s.verification_status = 'verified' and s.verified));
create policy "staff manage sourcing story farmers" on sourcing_story_farmers for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read sourcing story producers" on sourcing_story_producers for select
  using (exists (select 1 from sourcing_stories s where s.id = story_id and s.verification_status = 'verified' and s.verified));
create policy "staff manage sourcing story producers" on sourcing_story_producers for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified product editorials" on product_editorials for select
  using (verification_status = 'verified' and verified);
create policy "staff manage product editorials" on product_editorials for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read product editorial farmers" on product_editorial_farmers for select
  using (exists (select 1 from product_editorials e where e.id = editorial_id and e.verification_status = 'verified' and e.verified));
create policy "staff manage product editorial farmers" on product_editorial_farmers for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified gift editorials" on gift_editorials for select
  using (verification_status = 'verified' and verified);
create policy "staff manage gift editorials" on gift_editorials for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified recipes" on recipes for select
  using (verification_status = 'verified' and verified);
create policy "staff manage recipes" on recipes for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read recipe ingredients" on recipe_ingredients for select
  using (exists (select 1 from recipes r where r.id = recipe_id and r.verification_status = 'verified' and r.verified));
create policy "staff manage recipe ingredients" on recipe_ingredients for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read recipe steps" on recipe_steps for select
  using (exists (select 1 from recipes r where r.id = recipe_id and r.verification_status = 'verified' and r.verified));
create policy "staff manage recipe steps" on recipe_steps for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read recipe related products" on recipe_related_products for select
  using (exists (select 1 from recipes r where r.id = recipe_id and r.verification_status = 'verified' and r.verified));
create policy "staff manage recipe related products" on recipe_related_products for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified journal articles" on journal_articles for select
  using (verification_status = 'verified' and verified);
create policy "staff manage journal articles" on journal_articles for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read journal article places" on journal_article_places for select
  using (exists (select 1 from journal_articles a where a.id = article_id and a.verification_status = 'verified' and a.verified));
create policy "staff manage journal article places" on journal_article_places for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read journal article related products" on journal_article_related_products for select
  using (exists (select 1 from journal_articles a where a.id = article_id and a.verification_status = 'verified' and a.verified));
create policy "staff manage journal article related products" on journal_article_related_products for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified standard pages" on standard_pages for select
  using (verification_status = 'verified' and verified);
create policy "staff manage standard pages" on standard_pages for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified legal pages" on legal_pages for select
  using (verification_status = 'verified' and verified);
create policy "staff manage legal pages" on legal_pages for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read verified homepages" on homepages for select
  using (verification_status = 'verified' and verified);
create policy "staff manage homepages" on homepages for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

create policy "public read homepage featured products" on homepage_featured_products for select
  using (exists (select 1 from homepages h where h.id = homepage_id and h.verification_status = 'verified' and h.verified));
create policy "staff manage homepage featured products" on homepage_featured_products for all
  using (has_permission('content', 'manage')) with check (has_permission('content', 'manage'));

-- Base table grants ---------------------------------------------------------------------------
-- A hosted Supabase project applies these automatically at project-creation time, so this block
-- is normally a no-op there -- it exists so this schema is also correct and self-contained on a
-- plain Postgres instance (local testing, self-hosting) that hasn't had Supabase's platform-level
-- defaults applied. RLS policies above are still the real gate; grants only make a role eligible
-- to be checked against them at all.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;

-- Re-apply the append-only revoke from migration 8/9: the blanket grant above would otherwise
-- silently restore UPDATE/DELETE on these two audit ledgers. RLS (no update/delete policy exists
-- for either table) and the forbid_mutation triggers already block this independently, but keeping
-- the grant itself revoked avoids three layers of defense quietly shrinking to two.
revoke update, delete on payment_audits, admin_audit_log from anon, authenticated;
