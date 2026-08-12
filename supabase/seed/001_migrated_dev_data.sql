-- Migrated data from the local Medusa Postgres database (docker-compose `postgres` service,
-- database `bangla_blend`) as of 2026-08-08. Exported by querying the running container directly
-- (see migration plan). The Sanity dataset (project wu49jhtl/production) was queried live and
-- contains zero documents, so there is no CMS content to migrate.
--
-- Scope: migrated "as-is" per explicit instruction, including QA/smoke-test rows -- this is a
-- development database, not a production one. Soft-deleted rows in the source (deleted_at is not
-- null: 8 of 16 products, one storefront category) are EXCLUDED because they represent state the
-- source system itself no longer considers active; resurrecting them would misrepresent "as-is".
--
-- IDs are remapped from Medusa's text IDs (e.g. "prod_01K...") to deterministic uuids via
-- md5('<namespace>:<original id>')::uuid, so the same source row always maps to the same uuid
-- across every statement in this file (and if this file is re-run). The original id is kept in an
-- inline comment next to each row for traceability.
--
-- Rows that referenced a Medusa admin user id (admin_audit_log.actor_id, app_settings.updated_by)
-- are inserted with that column NULL: no Supabase Auth user exists yet for the old bootstrap admin
-- (that gets created in Phase 4 when apps/admin auth is built). The original id is preserved in
-- each row's metadata as legacy_actor_id / legacy_updated_by so nothing is silently lost.

begin;

-- Regions --------------------------------------------------------------------------------------

insert into regions (id, name, currency_code, market_code, is_domestic, is_active, metadata, created_at) values
  (md5('region:reg_01KYMKFRFF0C3TFP0SGAE93DV9')::uuid, 'Bangladesh', 'bdt', 'bd', true, true,
   '{"legacy_id": "reg_01KYMKFRFF0C3TFP0SGAE93DV9", "review_required": true, "bootstrap_created": true}', '2026-07-28T14:53:59.674+00'),
  (md5('region:reg_01KYMQ3DZX4AM8KX7PY29YJG0R')::uuid, 'United Kingdom', 'gbp', 'gb', false, false,
   '{"legacy_id": "reg_01KYMQ3DZX4AM8KX7PY29YJG0R", "isPlaceholder": true}', '2026-07-28T15:57:10.025+00'),
  (md5('region:reg_01KYMQ3DZXCQZWCT6B8K2N2AHR')::uuid, 'United States', 'usd', 'us', false, false,
   '{"legacy_id": "reg_01KYMQ3DZXCQZWCT6B8K2N2AHR", "isPlaceholder": true}', '2026-07-28T15:57:10.025+00');

-- Product collections (the 6 fixed primary destinations) ----------------------------------------

insert into product_collections (id, title, handle, created_at, updated_at) values
  (md5('collection:pcol_01KYMPWTJV7ZYAZAMF7VC8R6DR')::uuid, 'Originals', 'originals', '2026-07-28T15:53:33.53+00', '2026-07-28T15:53:33.53+00'),
  (md5('collection:pcol_01KYMPWTJWESPRY7YRAATAJM3M')::uuid, 'Reserve', 'reserve', '2026-07-28T15:53:33.53+00', '2026-07-28T15:53:33.53+00'),
  (md5('collection:pcol_01KYMPWTJWNMHRR9TN2TCT17D9')::uuid, 'Pantry', 'pantry', '2026-07-28T15:53:33.53+00', '2026-07-28T15:53:33.53+00'),
  (md5('collection:pcol_01KYMPWTJWGJWWV1NNFC4W8W5Y')::uuid, 'Tea & Wellness', 'tea-wellness', '2026-07-28T15:53:33.53+00', '2026-07-28T15:53:33.53+00'),
  (md5('collection:pcol_01KYMPWTJWKZ8RA1TN20BY1ADN')::uuid, 'Lifestyle Accessories', 'lifestyle-accessories', '2026-07-28T15:53:33.53+00', '2026-07-28T15:53:33.53+00'),
  (md5('collection:pcol_01KYMPWTJWT4RK2YNA3JJFCKX8')::uuid, 'Gifts', 'gifts', '2026-07-28T15:53:33.53+00', '2026-07-28T15:53:33.53+00');

-- Stock locations --------------------------------------------------------------------------------

insert into stock_locations (id, name, is_primary, created_at) values
  (md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 'Bangla Blend primary warehouse', true, '2026-07-28T14:53:59.674+00'),
  (md5('location:sloc_01KYMPWV7N51AW6HB8CHPVHN58')::uuid, 'Sample Bangladesh warehouse', false, '2026-07-28T15:53:33.53+00');

-- Products (8 active; 8 soft-deleted source rows excluded) --------------------------------------

insert into products (id, title, handle, subtitle, description, status, thumbnail_url, thumbnail_alt,
    collection_id, region, storage, shelf_life, usage_notes, ingredients, eligible_markets, badges,
    best_seller, is_placeholder, verified, metadata, created_at, updated_at) values
  (md5('product:prod_01KYMPWTR90XC1QDM7B52VVG8A')::uuid, 'Mezban Masala', 'mezban-masala',
   'Authentic Chattogram spice blend for rich traditional dishes',
   'Bangla Blend Mezban Masala is a carefully crafted spice blend inspired by Chattogram''s famous Mezban cuisine. Ideal for beef mezban, beef curry, mutton and other rich traditional dishes, it brings bold, balanced flavour, deep aroma and rich natural colour to home cooking.',
   'published', '/images/products/mezban-masala-product.webp', null,
   (select id from product_collections where handle = 'originals'), 'Chattogram', null, null, null, null,
   array['bd','gb','us']::market_code[], array['Bestseller','Signature blend'], true, false, true,
   '{"legacy_id": "prod_01KYMPWTR90XC1QDM7B52VVG8A", "catalog_revision": "bd-price-list-2026-07-29"}',
   '2026-07-28T15:53:33.733+00', '2026-07-29T12:36:17.606+00'),

  (md5('product:prod_01KYMPWTR988DS4AMAM3GKYVQS')::uuid, 'Cox''s Bazar Fish Masala', 'coxs-bazar-fish-masala',
   'A balanced coastal blend for fish, seafood and marinades',
   'Bangla Blend Cox''s Bazar Fish Masala is crafted to bring rich coastal flavour to grilled fish, barbecue, fried fish, curries and seafood marinades. Its balanced aromatic spices add savoury depth, inviting aroma and rich natural colour without overpowering the fish.',
   'published', '/images/products/coxs-bazar-fish-masala-product.webp', null,
   (select id from product_collections where handle = 'originals'), 'Cox''s Bazar', null, null, null, null,
   array['bd','gb','us']::market_code[], array['Bestseller','Coastal blend'], true, false, true,
   '{"legacy_id": "prod_01KYMPWTR988DS4AMAM3GKYVQS", "catalog_revision": "bd-price-list-2026-07-29"}',
   '2026-07-28T15:53:33.734+00', '2026-07-29T12:36:18.221+00'),

  (md5('product:prod_01KYMPWTRAHY4M1KAH0P1F771Y')::uuid, 'Hathazari Red Chilli Powder', 'hathazari-red-chili',
   'Vibrant colour and balanced heat for everyday cooking',
   'Bangla Blend Hathazari Red Chilli Powder is made from carefully selected red chillies for vibrant colour, rich aroma and balanced heat. The stems and most seeds are removed before grinding for a smoother, cleaner powder suited to curries, stir fries, marinades, barbecue, snacks and traditional Bangladeshi recipes.',
   'published', '/images/products/hathazari-red-chilli-product.webp', null,
   (select id from product_collections where handle = 'reserve'), 'Hathazari', null, null, null, null,
   array['bd','gb']::market_code[], array['Bestseller','Reserve'], true, false, true,
   '{"legacy_id": "prod_01KYMPWTRAHY4M1KAH0P1F771Y", "catalog_revision": "bd-price-list-2026-07-29"}',
   '2026-07-28T15:53:33.734+00', '2026-07-29T12:36:18.365+00'),

  (md5('product:prod_01KYPKY0RWWNRWVTHK2F8FKV7W')::uuid, 'Black Pepper', 'black-pepper',
   'Premium whole black pepper with bold flavour and natural aroma',
   'Bangla Blend Black Pepper is made from carefully selected black peppercorns for bold flavour and a rich natural aroma. Use it in soups, curries, marinades, stir fries, grilled dishes and seasoning blends for a warm, mildly spicy finish.',
   'published', '/images/products/black-pepper-product.webp', null,
   (select id from product_collections where handle = 'reserve'), 'Origin pending verification', null, null, null, null,
   array['bd','gb','us']::market_code[], array['Whole spice','Reserve'], false, false, true,
   '{"legacy_id": "prod_01KYPKY0RWWNRWVTHK2F8FKV7W", "catalog_revision": "bd-price-list-2026-07-29"}',
   '2026-07-29T09:40:15.779+00', '2026-07-29T12:36:17.925+00'),

  (md5('product:prod_01KYPKY0RWA92BS82G27H0H9DZ')::uuid, 'Shahi Garam Masala', 'shahi-garam-masala',
   'A premium aromatic blend for biryani, korma and curries',
   'Bangla Blend Shahi Garam Masala combines carefully selected aromatic spices for rich flavour and a warm, royal aroma. Use it in biryani, pulao, korma, roast, rezala, curries and other Bangladeshi and South Asian dishes for balanced depth without overpowering the ingredients.',
   'published', '/images/products/shahi-garam-masala-product.webp', null,
   (select id from product_collections where handle = 'originals'), 'Bangladesh', null, null, null, null,
   array['bd','gb','us']::market_code[], array['Bestseller','Aromatic blend'], true, false, true,
   '{"legacy_id": "prod_01KYPKY0RWA92BS82G27H0H9DZ", "catalog_revision": "bd-price-list-2026-07-29"}',
   '2026-07-29T09:40:15.779+00', '2026-07-29T12:36:18.509+00'),

  (md5('product:prod_01KYPKY0RWAYZ1J9K9Y7253ZN2')::uuid, 'White Pepper Powder', 'white-pepper-powder',
   'Refined pepper warmth for soups, sauces and dishes with delicate colours',
   'Bangla Blend White Pepper Powder is finely ground for a smooth texture and refined flavour. Its mild heat and earthy aroma suit soups, sauces, marinades, stir fries, pasta, fried rice, seafood, chicken and recipes with delicate colours.',
   'published', '/images/products/white-pepper-powder-product.webp', null,
   (select id from product_collections where handle = 'reserve'), 'Origin pending verification', null, null, null, null,
   array['bd','gb','us']::market_code[], array['Fine ground','Reserve'], false, false, true,
   '{"legacy_id": "prod_01KYPKY0RWAYZ1J9K9Y7253ZN2", "catalog_revision": "bd-price-list-2026-07-29"}',
   '2026-07-29T09:40:15.779+00', '2026-07-30T11:52:46.846+00'),

  (md5('product:prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K')::uuid, 'notun masala', 'notun-masala',
   'bolbona',
   'bolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbona bolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbona',
   'published', 'http://localhost:9000/static/1785831026698-Gemini_Generated_Image_igqe8igqe8igqe8i.png', 'notun masala',
   (select id from product_collections where handle = 'reserve'), null,
   'bolbonabolbonabolbonabolbonabolbona',
   'bolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbona',
   'bolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbona',
   'bolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbonabolbona',
   array['bd']::market_code[], array[]::text[], false, false, true,
   '{"legacy_id": "prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K"}',
   '2026-08-04T08:10:39.832+00', '2026-08-06T07:29:54.302+00'),

  (md5('product:prod_01KZB74SMJP7DGVSFYREDPM7BZ')::uuid, 'new masala', 'new-masala',
   'bolbona bolbona bolbonabolbona bolbona bolbonabolbona bolbona bolbona',
   'bolbona bolbona bolbonabolbona bolbona bolbonabolbona bolbona bolbonabolbona bolbona bolbonabolbona bolbona bolbonabolbona bolbona bolbonabolbona bolbona bolbonabolbona bolbona bolbona',
   'published', 'http://localhost:9000/static/1786009228931-Gemini_Generated_Image_nt9dk9nt9dk9nt9d.png', 'new masala',
   (select id from product_collections where handle = 'pantry'), 'chtgng',
   'bolbona bolbona bolbona', 'bolbona bolbona bolbona', 'bolbona bolbona bolbona',
   'bolbona bolbona bolbona bolbona bolbona bolbona bolbona bolbona bolbona bolbona bolbona bolbona',
   array['bd']::market_code[], array['bolbona bolbona bolbona'], true, false, true,
   '{"legacy_id": "prod_01KZB74SMJP7DGVSFYREDPM7BZ"}',
   '2026-08-06T09:40:49.428+00', '2026-08-06T09:40:49.428+00');

-- Product images (only notun masala and new masala had an uploaded image) -----------------------

insert into product_images (product_id, url, sort_order, created_at) values
  (md5('product:prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K')::uuid, 'http://localhost:9000/static/1785831026698-Gemini_Generated_Image_igqe8igqe8igqe8i.png', 0, '2026-08-04T08:10:39.832+00'),
  (md5('product:prod_01KZB74SMJP7DGVSFYREDPM7BZ')::uuid, 'http://localhost:9000/static/1786009228931-Gemini_Generated_Image_nt9dk9nt9dk9nt9d.png', 0, '2026-08-06T09:40:49.428+00');

-- Product variants + prices ----------------------------------------------------------------------
-- One "Size" option per product, matching the guided product creator's single-option pattern.

insert into product_options (id, product_id, title) values
  (gen_random_uuid(), md5('product:prod_01KYMPWTR90XC1QDM7B52VVG8A')::uuid, 'Size'),
  (gen_random_uuid(), md5('product:prod_01KYMPWTR988DS4AMAM3GKYVQS')::uuid, 'Size'),
  (gen_random_uuid(), md5('product:prod_01KYMPWTRAHY4M1KAH0P1F771Y')::uuid, 'Size'),
  (gen_random_uuid(), md5('product:prod_01KYPKY0RWWNRWVTHK2F8FKV7W')::uuid, 'Size'),
  (gen_random_uuid(), md5('product:prod_01KYPKY0RWA92BS82G27H0H9DZ')::uuid, 'Size'),
  (gen_random_uuid(), md5('product:prod_01KYPKY0RWAYZ1J9K9Y7253ZN2')::uuid, 'Size'),
  (gen_random_uuid(), md5('product:prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K')::uuid, 'Size'),
  (gen_random_uuid(), md5('product:prod_01KZB74SMJP7DGVSFYREDPM7BZ')::uuid, 'Size');

insert into product_variants (id, product_id, title, sku, manage_inventory, option_values, sort_order) values
  (md5('variant:variant_01KYMPWV0558YH3AW92XZE6252')::uuid, md5('product:prod_01KYMPWTR90XC1QDM7B52VVG8A')::uuid, '80 g', 'SAMPLE-MEZ-80', true, '{"Size": "80 g"}', 0),
  (md5('variant:variant_01KYPPZGM323JG3PF0J7V4XHSE')::uuid, md5('product:prod_01KYMPWTR90XC1QDM7B52VVG8A')::uuid, '75 g', 'SAMPLE-MEZ-75', true, '{"Size": "75 g"}', 1),
  (md5('variant:variant_01KYPPZGM6V06PA6X445X64WAR')::uuid, md5('product:prod_01KYMPWTR90XC1QDM7B52VVG8A')::uuid, '100 g', 'SAMPLE-MEZ-100', true, '{"Size": "100 g"}', 2),

  (md5('variant:variant_01KYMPWV060CAVQ3263DCF4KHZ')::uuid, md5('product:prod_01KYMPWTR988DS4AMAM3GKYVQS')::uuid, '80 g', 'SAMPLE-FSH-80', true, '{"Size": "80 g"}', 0),
  (md5('variant:variant_01KYPPZJS13MP6W4823VRET2NP')::uuid, md5('product:prod_01KYMPWTR988DS4AMAM3GKYVQS')::uuid, '75 g', 'SAMPLE-FSH-75', true, '{"Size": "75 g"}', 1),
  (md5('variant:variant_01KYPPZJS14W7B33Z2W9SS3N58')::uuid, md5('product:prod_01KYMPWTR988DS4AMAM3GKYVQS')::uuid, '100 g', 'SAMPLE-FSH-100', true, '{"Size": "100 g"}', 2),

  (md5('variant:variant_01KYMPWV07HS4H41P94TDBZ1YH')::uuid, md5('product:prod_01KYMPWTRAHY4M1KAH0P1F771Y')::uuid, '60 g', 'SAMPLE-HTZ-60', true, '{"Size": "60 g"}', 0),
  (md5('variant:variant_01KYPPZK41JA7ZZ1STYJPQQ12J')::uuid, md5('product:prod_01KYMPWTRAHY4M1KAH0P1F771Y')::uuid, '100 g', 'SAMPLE-HTZ-100', true, '{"Size": "100 g"}', 1),
  (md5('variant:variant_01KYPPZK421C77TXMGYAGSZYNY')::uuid, md5('product:prod_01KYMPWTRAHY4M1KAH0P1F771Y')::uuid, '125 g', 'SAMPLE-HTZ-125', true, '{"Size": "125 g"}', 2),

  (md5('variant:variant_01KYPKY0YCZZ3ZPD28FPQHPY62')::uuid, md5('product:prod_01KYPKY0RWWNRWVTHK2F8FKV7W')::uuid, '70 g', 'SAMPLE-BLK-70', true, '{"Size": "70 g"}', 0),
  (md5('variant:variant_01KYPPZHRXYFT5RH58R9NB7QXZ')::uuid, md5('product:prod_01KYPKY0RWWNRWVTHK2F8FKV7W')::uuid, '75 g', 'SAMPLE-BLK-75', true, '{"Size": "75 g"}', 1),

  (md5('variant:variant_01KYPKY0YD2M45A6300GEPVZD8')::uuid, md5('product:prod_01KYPKY0RWA92BS82G27H0H9DZ')::uuid, '80 g', 'SAMPLE-SHA-80', true, '{"Size": "80 g"}', 0),
  (md5('variant:variant_01KYPPZKGBNAFN03NG4VAQXGE1')::uuid, md5('product:prod_01KYPKY0RWA92BS82G27H0H9DZ')::uuid, '75 g', 'SAMPLE-SHA-75', true, '{"Size": "75 g"}', 1),
  (md5('variant:variant_01KYPPZKGBMG61HE8EBEN18BKH')::uuid, md5('product:prod_01KYPKY0RWA92BS82G27H0H9DZ')::uuid, '100 g', 'SAMPLE-SHA-100', true, '{"Size": "100 g"}', 2),

  (md5('variant:variant_01KYPKY0YDWVNZCAV1YCAEABZ8')::uuid, md5('product:prod_01KYPKY0RWAYZ1J9K9Y7253ZN2')::uuid, '70 g', 'SAMPLE-WPP-70', true, '{"Size": "70 g"}', 0),
  (md5('variant:variant_01KYPPZJ7T3DYDKR1VS9ZKN6MZ')::uuid, md5('product:prod_01KYPKY0RWAYZ1J9K9Y7253ZN2')::uuid, '75 g', 'SAMPLE-WPP-75', true, '{"Size": "75 g"}', 1),

  (md5('variant:variant_01KZ5X69CJWHQGKQS35KRKDS0G')::uuid, md5('product:prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K')::uuid, '100 g', 'NOTUN_MASALA-100_G', true, '{"Size": "100 g"}', 0),
  (md5('variant:variant_01KZ5X69CN28T6VSWBEJZNRSAM')::uuid, md5('product:prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K')::uuid, '150 g', 'NOTUN_MASALA-150_G', true, '{"Size": "150 g"}', 1),

  (md5('variant:variant_01KZB74T1EGG3QQ8GE2KKEGM7P')::uuid, md5('product:prod_01KZB74SMJP7DGVSFYREDPM7BZ')::uuid, '100 g', 'NEW_MASALA-100_G', true, '{"Size": "100 g"}', 0),
  (md5('variant:variant_01KZB74T1EHNJ5WEABHPF51M6H')::uuid, md5('product:prod_01KZB74SMJP7DGVSFYREDPM7BZ')::uuid, '150 g', 'NEW_MASALA-150_G', true, '{"Size": "150 g"}', 1);

insert into product_prices (variant_id, currency_code, amount) values
  (md5('variant:variant_01KYMPWV0558YH3AW92XZE6252')::uuid, 'bdt', 320), (md5('variant:variant_01KYMPWV0558YH3AW92XZE6252')::uuid, 'gbp', 9), (md5('variant:variant_01KYMPWV0558YH3AW92XZE6252')::uuid, 'usd', 11),
  (md5('variant:variant_01KYPPZGM323JG3PF0J7V4XHSE')::uuid, 'bdt', 200), (md5('variant:variant_01KYPPZGM323JG3PF0J7V4XHSE')::uuid, 'gbp', 9), (md5('variant:variant_01KYPPZGM323JG3PF0J7V4XHSE')::uuid, 'usd', 11),
  (md5('variant:variant_01KYPPZGM6V06PA6X445X64WAR')::uuid, 'bdt', 220), (md5('variant:variant_01KYPPZGM6V06PA6X445X64WAR')::uuid, 'gbp', 10), (md5('variant:variant_01KYPPZGM6V06PA6X445X64WAR')::uuid, 'usd', 12),

  (md5('variant:variant_01KYMPWV060CAVQ3263DCF4KHZ')::uuid, 'bdt', 300), (md5('variant:variant_01KYMPWV060CAVQ3263DCF4KHZ')::uuid, 'gbp', 9), (md5('variant:variant_01KYMPWV060CAVQ3263DCF4KHZ')::uuid, 'usd', 11),
  (md5('variant:variant_01KYPPZJS13MP6W4823VRET2NP')::uuid, 'bdt', 200), (md5('variant:variant_01KYPPZJS13MP6W4823VRET2NP')::uuid, 'gbp', 9), (md5('variant:variant_01KYPPZJS13MP6W4823VRET2NP')::uuid, 'usd', 11),
  (md5('variant:variant_01KYPPZJS14W7B33Z2W9SS3N58')::uuid, 'bdt', 220), (md5('variant:variant_01KYPPZJS14W7B33Z2W9SS3N58')::uuid, 'gbp', 10), (md5('variant:variant_01KYPPZJS14W7B33Z2W9SS3N58')::uuid, 'usd', 12),

  (md5('variant:variant_01KYMPWV07HS4H41P94TDBZ1YH')::uuid, 'bdt', 420), (md5('variant:variant_01KYMPWV07HS4H41P94TDBZ1YH')::uuid, 'gbp', 12), (md5('variant:variant_01KYMPWV07HS4H41P94TDBZ1YH')::uuid, 'usd', 15),
  (md5('variant:variant_01KYPPZK41JA7ZZ1STYJPQQ12J')::uuid, 'bdt', 200), (md5('variant:variant_01KYPPZK41JA7ZZ1STYJPQQ12J')::uuid, 'gbp', 12), (md5('variant:variant_01KYPPZK41JA7ZZ1STYJPQQ12J')::uuid, 'usd', 15),
  (md5('variant:variant_01KYPPZK421C77TXMGYAGSZYNY')::uuid, 'bdt', 220), (md5('variant:variant_01KYPPZK421C77TXMGYAGSZYNY')::uuid, 'gbp', 13), (md5('variant:variant_01KYPPZK421C77TXMGYAGSZYNY')::uuid, 'usd', 16),

  (md5('variant:variant_01KYPKY0YCZZ3ZPD28FPQHPY62')::uuid, 'bdt', 480), (md5('variant:variant_01KYPKY0YCZZ3ZPD28FPQHPY62')::uuid, 'gbp', 11), (md5('variant:variant_01KYPKY0YCZZ3ZPD28FPQHPY62')::uuid, 'usd', 14),
  (md5('variant:variant_01KYPPZHRXYFT5RH58R9NB7QXZ')::uuid, 'bdt', 250), (md5('variant:variant_01KYPPZHRXYFT5RH58R9NB7QXZ')::uuid, 'gbp', 11), (md5('variant:variant_01KYPPZHRXYFT5RH58R9NB7QXZ')::uuid, 'usd', 14),

  (md5('variant:variant_01KYPKY0YD2M45A6300GEPVZD8')::uuid, 'bdt', 340), (md5('variant:variant_01KYPKY0YD2M45A6300GEPVZD8')::uuid, 'gbp', 8), (md5('variant:variant_01KYPKY0YD2M45A6300GEPVZD8')::uuid, 'usd', 10),
  (md5('variant:variant_01KYPPZKGBNAFN03NG4VAQXGE1')::uuid, 'bdt', 250), (md5('variant:variant_01KYPPZKGBNAFN03NG4VAQXGE1')::uuid, 'gbp', 8), (md5('variant:variant_01KYPPZKGBNAFN03NG4VAQXGE1')::uuid, 'usd', 10),
  (md5('variant:variant_01KYPPZKGBMG61HE8EBEN18BKH')::uuid, 'bdt', 300), (md5('variant:variant_01KYPPZKGBMG61HE8EBEN18BKH')::uuid, 'gbp', 9), (md5('variant:variant_01KYPPZKGBMG61HE8EBEN18BKH')::uuid, 'usd', 11),

  (md5('variant:variant_01KYPKY0YDWVNZCAV1YCAEABZ8')::uuid, 'bdt', 450), (md5('variant:variant_01KYPKY0YDWVNZCAV1YCAEABZ8')::uuid, 'gbp', 10), (md5('variant:variant_01KYPKY0YDWVNZCAV1YCAEABZ8')::uuid, 'usd', 13),
  (md5('variant:variant_01KYPPZJ7T3DYDKR1VS9ZKN6MZ')::uuid, 'bdt', 270), (md5('variant:variant_01KYPPZJ7T3DYDKR1VS9ZKN6MZ')::uuid, 'gbp', 10), (md5('variant:variant_01KYPPZJ7T3DYDKR1VS9ZKN6MZ')::uuid, 'usd', 13),

  (md5('variant:variant_01KZ5X69CJWHQGKQS35KRKDS0G')::uuid, 'bdt', 180),
  (md5('variant:variant_01KZ5X69CN28T6VSWBEJZNRSAM')::uuid, 'bdt', 250),

  (md5('variant:variant_01KZB74T1EGG3QQ8GE2KKEGM7P')::uuid, 'bdt', 200),
  (md5('variant:variant_01KZB74T1EHNJ5WEABHPF51M6H')::uuid, 'bdt', 300);

-- Inventory levels (source: inventory_level joined to product_variant_inventory_item) ------------

insert into inventory_levels (variant_id, location_id, stocked_quantity, reserved_quantity) values
  (md5('variant:variant_01KYMPWV0558YH3AW92XZE6252')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 30, 0),
  (md5('variant:variant_01KYPPZGM323JG3PF0J7V4XHSE')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 30, 2),
  (md5('variant:variant_01KYPPZGM6V06PA6X445X64WAR')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 20, 0),

  (md5('variant:variant_01KYMPWV060CAVQ3263DCF4KHZ')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 24, 0),
  (md5('variant:variant_01KYPPZJS13MP6W4823VRET2NP')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 24, 0),
  (md5('variant:variant_01KYPPZJS14W7B33Z2W9SS3N58')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 18, 0),

  (md5('variant:variant_01KYMPWV07HS4H41P94TDBZ1YH')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 12, 0),
  (md5('variant:variant_01KYPPZK41JA7ZZ1STYJPQQ12J')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 12, 0),
  (md5('variant:variant_01KYPPZK421C77TXMGYAGSZYNY')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 10, 0),

  (md5('variant:variant_01KYPKY0YCZZ3ZPD28FPQHPY62')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 20, 0),
  (md5('variant:variant_01KYPPZHRXYFT5RH58R9NB7QXZ')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 20, 1),

  (md5('variant:variant_01KYPKY0YD2M45A6300GEPVZD8')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 26, 0),
  (md5('variant:variant_01KYPPZKGBNAFN03NG4VAQXGE1')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 26, 0),
  (md5('variant:variant_01KYPPZKGBMG61HE8EBEN18BKH')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 20, 0),

  (md5('variant:variant_01KYPKY0YDWVNZCAV1YCAEABZ8')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 18, 0),
  (md5('variant:variant_01KYPPZJ7T3DYDKR1VS9ZKN6MZ')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 18, 0),

  (md5('variant:variant_01KZ5X69CJWHQGKQS35KRKDS0G')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 10, 0),
  (md5('variant:variant_01KZ5X69CN28T6VSWBEJZNRSAM')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 10, 0),

  (md5('variant:variant_01KZB74T1EGG3QQ8GE2KKEGM7P')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 10, 0),
  (md5('variant:variant_01KZB74T1EHNJ5WEABHPF51M6H')::uuid, md5('location:sloc_01KYMKFRMAY93YVX5ZFCXP0SRJ')::uuid, 9, 0);

-- Product market / origin operational records (only for surviving products) ---------------------

insert into product_market_details (product_id, bangladesh_available, international_available,
    supported_countries, restricted_countries, export_ready, domestic_only, country_of_origin, verified) values
  (md5('product:prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K')::uuid, true, false, array['bd'], array[]::text[], false, true, 'BD', false),
  (md5('product:prod_01KZB74SMJP7DGVSFYREDPM7BZ')::uuid, true, false, array['bd'], array[]::text[], false, true, 'BD', true);

insert into product_origin_details (product_id, locality, verification_status) values
  (md5('product:prod_01KZB74SMJP7DGVSFYREDPM7BZ')::uuid, 'chtgng', 'draft');
-- prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K had a product_origin row with every field null (draft, no
-- evidence) -- not migrated since it carries no information beyond the default row shape.

commit;
