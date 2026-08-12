-- Migrated admin_audit_log (18 rows, append-only) and app_settings (9 rows). See
-- 001_migrated_dev_data.sql for scope notes. actor_id / updated_by are NULL (no Supabase Auth
-- user exists yet for the old Medusa bootstrap admin "user_01KYMHCWJEB2BDS4208DASDX9D"); the
-- legacy id is preserved in each row's metadata as legacy_actor_id / legacy_updated_by.
--
-- admin_audit_log's forbid_mutation triggers only block UPDATE/DELETE, not this initial INSERT,
-- so a one-time migration load is fine; nothing can touch these rows afterward.

begin;

insert into admin_audit_log (id, actor_id, actor_email, action, resource_type, resource_id, resource_label, summary, before, after, request_id, metadata, created_at) values
  (gen_random_uuid(), null, null, 'catalog.product.updated', 'product', 'prod_01KYMM0VV8XX4EG8R97EEXK400', 'QA Superadmin Round Trip', 'Updated product QA Superadmin Round Trip.',
   '{"title": "QA Superadmin Round Trip", "handle": "qa-superadmin-roundtrip-20260728", "status": "published", "metadata": {"region": "Bangladesh", "verified": true, "thumbnail_alt": "Temporary QA product image", "is_placeholder": false, "eligible_markets": ["bd"]}}',
   '{"title": "QA Superadmin Round Trip", "handle": "qa-superadmin-roundtrip-20260728", "status": "published", "metadata": {"usage": "Temporary round-trip verification only.", "region": "Bangladesh", "storage": "Store in a cool, dry place.", "verified": true, "shelf_life": "365 days", "ingredients": "QA ingredient", "thumbnail_alt": "Temporary QA product image", "is_placeholder": false, "product_badges": ["QA verified"], "eligible_markets": ["bd"]}}',
   '9d48f6e0-df36-4271-811e-f9248b5f2183', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-07-28T15:03:22.719+00'),

  (gen_random_uuid(), null, null, 'catalog.product.deleted', 'product', 'prod_01KYMM0VV8XX4EG8R97EEXK400', 'QA Superadmin Round Trip', 'Deleted product QA Superadmin Round Trip.',
   '{"title": "QA Superadmin Round Trip", "handle": "qa-superadmin-roundtrip-20260728", "status": "published"}',
   null, 'c920d398-a330-45ac-902c-c00486a08874', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-07-28T15:03:23.664+00'),

  (gen_random_uuid(), null, null, 'catalog.product.created', 'product', 'prod_01KZ4J65DW4W0206TA5S9E609M', 'Variant verification 1785785945', 'Created Variant verification 1785785945 in originals with 2 priced variants.',
   null,
   '{"title": "Variant verification 1785785945", "handle": "variant-verification-1785785945", "variants": [{"sku": "VERIFY-1785785945-100", "title": "100 g", "bdt_price": 180}, {"sku": "VERIFY-1785785945-150", "title": "150 g", "bdt_price": 250}], "gift_type": null, "collection": "originals", "storefront_visible": false}',
   '1f7cb87e-9f99-4b71-ac3b-f907ba764edc', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-03T22:39:24.474+00'),

  (gen_random_uuid(), null, null, 'catalog.product.deleted', 'product', 'prod_01KZ4J65DW4W0206TA5S9E609M', 'Variant verification 1785785945', 'Deleted product Variant verification 1785785945.',
   '{"title": "Variant verification 1785785945", "handle": "variant-verification-1785785945", "status": "draft"}',
   null, 'e023d93f-8eb4-4ae0-9a89-06cf600c57f7', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-04T04:30:35.255+00'),

  (gen_random_uuid(), null, null, 'catalog.product.created', 'product', 'prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K', 'notun masala', 'Created notun masala in reserve with 2 priced variants.',
   null,
   '{"title": "notun masala", "handle": "notun-masala", "variants": [{"sku": "NOTUN_MASALA-100_G", "title": "100 g", "bdt_price": 180}, {"sku": "NOTUN_MASALA-150_G", "title": "150 g", "bdt_price": 250}], "gift_type": null, "collection": "reserve", "storefront_visible": false}',
   'a17bd264-4d82-4eac-85dd-bdcd6ef86947', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-04T08:10:40.85+00'),

  (gen_random_uuid(), null, null, 'catalog.product.updated', 'product', 'prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K', 'notun masala', 'Updated product notun masala.',
   '{"title": "notun masala", "handle": "notun-masala", "status": "draft", "metadata": {"verified": false, "is_placeholder": true}}',
   '{"title": "notun masala", "handle": "notun-masala", "status": "draft", "metadata": {"verified": false, "is_placeholder": true}}',
   'b60e0c70-58d3-405d-bcd8-9084973258b7', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-04T08:11:14.678+00'),

  (gen_random_uuid(), null, null, 'catalog.product.updated', 'product', 'prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K', 'notun masala', 'Updated product notun masala.',
   '{"title": "notun masala", "handle": "notun-masala", "status": "draft", "metadata": {"verified": false, "is_placeholder": true}}',
   '{"title": "notun masala", "handle": "notun-masala", "status": "draft", "metadata": {"verified": false, "is_placeholder": true}}',
   'f41a203d-8e41-4fba-99f2-3551029b9ed0', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-04T08:19:22.942+00'),

  (gen_random_uuid(), null, null, 'catalog.product.updated', 'product', 'prod_01KZ5X68SNKFFHVR9EX1EJ2Q1K', 'notun masala', 'Updated product notun masala.',
   '{"title": "notun masala", "handle": "notun-masala", "status": "published", "metadata": {"verified": false, "is_placeholder": true}}',
   '{"title": "notun masala", "handle": "notun-masala", "status": "published", "metadata": {"verified": true, "is_placeholder": false}}',
   '5312199f-5792-4238-bfc1-853cd9dc060c', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-06T07:29:54.533+00'),

  (gen_random_uuid(), null, null, 'catalog.category.updated', 'product_category', 'pcat_01KZB2SV9Z06MRT0GAMSFBWZMZ', 'Build a Box', 'Updated storefront catalog Build a Box.',
   '{"id": "pcat_01KZB2SV9Z06MRT0GAMSFBWZMZ", "name": "Build a Box", "handle": "build-a-box", "section": "gifts", "box_size": 3, "is_active": true, "experience": "build_a_box", "product_count": 6}',
   '{"id": "pcat_01KZB2SV9Z06MRT0GAMSFBWZMZ", "name": "Build a Box", "handle": "build-a-box", "section": "gifts", "box_size": 3, "is_active": false, "experience": "build_a_box", "product_count": 6}',
   '02056647-919c-4313-9632-71e0e8e3d2b5', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-06T08:54:33.234+00'),

  (gen_random_uuid(), null, null, 'catalog.category.created', 'product_category', 'pcat_01KZB4XEN00S8RE2C2H1DJG56Y', 'Admin Smoke 1786006910324', 'Created Admin Smoke 1786006910324 under gifts as a listing catalog.',
   null, '{"name": "Admin Smoke 1786006910324", "handle": "admin-smoke-1786006910324", "section": "gifts", "box_size": null, "experience": "listing"}',
   '6a31a966-abf6-4f95-bf1d-e22cf8e24c0d', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-06T09:01:51.9+00'),

  (gen_random_uuid(), null, null, 'catalog.category.deleted', 'product_category', 'pcat_01KZB4XEN00S8RE2C2H1DJG56Y', 'Admin Smoke 1786006910324', 'Deleted storefront catalog Admin Smoke 1786006910324 and removed 0 product assignments.',
   '{"id": "pcat_01KZB4XEN00S8RE2C2H1DJG56Y", "name": "Admin Smoke 1786006910324", "handle": "admin-smoke-1786006910324", "section": "gifts", "is_active": true, "experience": "listing", "product_count": 0}',
   null, 'c594ffcc-cfc4-49e9-83f4-eba7f38f1d92', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-06T09:01:52.216+00'),

  (gen_random_uuid(), null, null, 'catalog.category.created', 'product_category', 'pcat_01KZB50J7JW9MGZF1VMZ711KYZ', 'Admin Smoke 1786007012445', 'Created Admin Smoke 1786007012445 under gifts as a listing catalog.',
   null, '{"name": "Admin Smoke 1786007012445", "handle": "admin-smoke-1786007012445", "section": "gifts", "box_size": null, "experience": "listing"}',
   '94afcb91-e186-4e5b-823b-3ebd2fd76db4', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-06T09:03:33.656+00'),

  (gen_random_uuid(), null, null, 'catalog.category.deleted', 'product_category', 'pcat_01KZB50J7JW9MGZF1VMZ711KYZ', 'Admin Smoke 1786007012445', 'Deleted storefront catalog Admin Smoke 1786007012445 and removed 0 product assignments.',
   '{"id": "pcat_01KZB50J7JW9MGZF1VMZ711KYZ", "name": "Admin Smoke 1786007012445", "handle": "admin-smoke-1786007012445", "section": "gifts", "is_active": true, "experience": "listing", "product_count": 0}',
   null, '7e379aac-ba6b-4972-b692-3a078ca29dcc', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-06T09:03:33.947+00'),

  (gen_random_uuid(), null, null, 'catalog.category.created', 'product_category', 'pcat_01KZB54X921QJFZ1DT7ZYZQHKN', 'Admin Smoke 1786007154991', 'Created Admin Smoke 1786007154991 under gifts as a listing catalog.',
   null, '{"name": "Admin Smoke 1786007154991", "handle": "admin-smoke-1786007154991", "section": "gifts", "box_size": null, "experience": "listing"}',
   '3526589e-075a-40e9-bfd2-c26071524407', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-06T09:05:56.335+00'),

  (gen_random_uuid(), null, null, 'catalog.category.deleted', 'product_category', 'pcat_01KZB54X921QJFZ1DT7ZYZQHKN', 'Admin Smoke 1786007154991', 'Deleted storefront catalog Admin Smoke 1786007154991 and removed 0 product assignments.',
   '{"id": "pcat_01KZB54X921QJFZ1DT7ZYZQHKN", "name": "Admin Smoke 1786007154991", "handle": "admin-smoke-1786007154991", "section": "gifts", "is_active": true, "experience": "listing", "product_count": 0}',
   null, '6fb9d6e6-181d-4427-974d-bc0b819126f8', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-06T09:05:59.825+00'),

  (gen_random_uuid(), null, null, 'catalog.category.deleted', 'product_category', 'pcat_01KZB2SV9Z06MRT0GAMSFBWZMZ', 'Build a Box', 'Deleted storefront catalog Build a Box and removed 6 product assignments.',
   '{"id": "pcat_01KZB2SV9Z06MRT0GAMSFBWZMZ", "name": "Build a Box", "handle": "build-a-box", "section": "gifts", "box_size": 3, "is_active": false, "experience": "build_a_box", "product_count": 6}',
   null, 'ec17fbec-6e39-4e25-9f7f-79e435f75895', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-06T09:17:23.914+00'),

  (gen_random_uuid(), null, null, 'catalog.product.created', 'product', 'prod_01KZB74SMJP7DGVSFYREDPM7BZ', 'new masala', 'Created new masala in pantry with 2 priced variants.',
   null,
   '{"title": "new masala", "handle": "new-masala", "variants": [{"sku": "NEW_MASALA-100_G", "title": "100 g", "bdt_price": 200}, {"sku": "NEW_MASALA-150_G", "title": "150 g", "bdt_price": 300}], "gift_type": null, "collection": "pantry", "storefront_visible": true}',
   '85a02a58-9027-4025-9320-a91c987cea8e', '{"legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-06T09:40:50.113+00'),

  (gen_random_uuid(), null, null, 'order.workflow.fulfill', 'order', 'order_01KZB8EFC2NGAMAPT1Y2AX7GBZ', 'order_04', 'fulfill recorded for order_04.',
   '{"status": "pending", "next_action": "fulfill", "payment_status": "captured", "fulfillment_status": "not_fulfilled"}',
   '{"status": "pending", "next_action": "ship", "payment_status": "captured", "fulfillment_status": "fulfilled"}',
   '0e415413-5831-4f9a-9dd7-a7da6cdfa5a9', '{"notify_customer": true, "legacy_actor_id": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-08-06T11:08:40.215+00');

-- App settings -------------------------------------------------------------------------------

insert into app_settings (id, key, "group", label, description, value, value_type, is_public, is_secret, sort_order, updated_by, metadata, created_at, updated_at) values
  (gen_random_uuid(), 'branding.site_name', 'branding', 'Site name', 'Customer-facing brand name used by connected storefront surfaces.',
   '{"data": "Bangla Blend"}', 'string', true, false, 10, null, '{"legacy_updated_by": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-07-28T14:17:28.724+00', '2026-07-28T14:17:28.724+00'),

  (gen_random_uuid(), 'support.email', 'support', 'Support email', 'Primary customer-support address.',
   '{"data": "hello@example.com"}', 'string', true, false, 10, null, '{"legacy_updated_by": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-07-28T14:17:28.737+00', '2026-07-28T14:17:28.737+00'),

  (gen_random_uuid(), 'support.phone', 'support', 'Support telephone', 'Optional public support telephone number.',
   '{"data": ""}', 'string', true, false, 20, null, '{"legacy_updated_by": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-07-28T14:17:28.748+00', '2026-07-28T14:17:28.748+00'),

  (gen_random_uuid(), 'storefront.maintenance_mode', 'storefront', 'Maintenance mode', 'Public operational flag for connected storefront deployments. Deployment middleware must opt in before enabling.',
   '{"data": false}', 'boolean', true, false, 10, null, '{"legacy_updated_by": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-07-28T14:17:28.76+00', '2026-07-28T14:17:28.76+00'),

  (gen_random_uuid(), 'catalog.default_market', 'catalog', 'Default market', 'Default merchandising market code.',
   '{"data": "bd"}', 'string', true, false, 10, null, '{"legacy_updated_by": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-07-28T14:17:28.772+00', '2026-07-28T14:17:28.772+00'),

  (gen_random_uuid(), 'catalog.low_stock_threshold', 'catalog', 'Low-stock threshold', 'Operations threshold used for dashboard attention queues.',
   '{"data": 10}', 'number', false, false, 20, null, '{"legacy_updated_by": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-07-28T14:17:28.785+00', '2026-07-28T14:17:28.785+00'),

  (gen_random_uuid(), 'catalog.verification_required', 'catalog', 'Require catalog verification', 'Documents the fail-closed storefront publishing policy.',
   '{"data": true}', 'boolean', false, false, 30, null, '{"legacy_updated_by": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-07-28T14:17:28.798+00', '2026-07-28T14:17:28.798+00'),

  (gen_random_uuid(), 'content.studio_url', 'content', 'Editorial content admin URL', 'Launch URL shown to superadmins for narrative content management.',
   '{"data": "http://localhost:3001/content"}', 'string', false, false, 10, null, '{"legacy_updated_by": "user_01KYMHCWJEB2BDS4208DASDX9D", "note": "Repointed from the retired Sanity Studio URL to the new apps/admin content workspace."}', '2026-07-28T14:17:28.81+00', '2026-07-28T14:17:28.81+00'),

  (gen_random_uuid(), 'orders.manual_review_threshold', 'orders', 'Manual review threshold', 'Documented order-value threshold for operations review, in the default market currency.',
   '{"data": 25000}', 'number', false, false, 10, null, '{"legacy_updated_by": "user_01KYMHCWJEB2BDS4208DASDX9D"}', '2026-07-28T14:17:28.836+00', '2026-07-28T14:17:28.836+00');

commit;
