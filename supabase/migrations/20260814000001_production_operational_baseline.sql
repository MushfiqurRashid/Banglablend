-- Complete the production baseline without importing development users, audit events, or orders.
-- Existing cloud-managed setting values win; only known development placeholders are corrected.

insert into public.app_settings
  (key, "group", label, description, value, value_type, is_public, is_secret, sort_order)
values
  ('branding.site_name', 'branding', 'Site name',
   'Customer-facing brand name used by connected storefront surfaces.',
   '{"data":"Bangla Blend"}'::jsonb, 'string', true, false, 10),
  ('support.email', 'support', 'Support email',
   'Primary customer-support address.',
   '{"data":"banglablend@gmail.com"}'::jsonb, 'string', true, false, 10),
  ('support.phone', 'support', 'Support telephone',
   'Optional public support telephone number.',
   '{"data":""}'::jsonb, 'string', true, false, 20),
  ('storefront.maintenance_mode', 'storefront', 'Maintenance mode',
   'Public operational flag for connected storefront deployments.',
   '{"data":false}'::jsonb, 'boolean', true, false, 10),
  ('catalog.default_market', 'catalog', 'Default market',
   'Default merchandising market code.',
   '{"data":"bd"}'::jsonb, 'string', true, false, 10),
  ('catalog.low_stock_threshold', 'catalog', 'Low-stock threshold',
   'Operations threshold used for dashboard attention queues.',
   '{"data":10}'::jsonb, 'number', false, false, 20),
  ('catalog.verification_required', 'catalog', 'Require catalog verification',
   'Documents the fail-closed storefront publishing policy.',
   '{"data":true}'::jsonb, 'boolean', false, false, 30),
  ('content.studio_url', 'content', 'Editorial content admin URL',
   'Launch URL shown to superadmins for narrative content management.',
   '{"data":"https://bpanel.banglablend.store/content"}'::jsonb, 'string', false, false, 10),
  ('orders.manual_review_threshold', 'orders', 'Manual review threshold',
   'Order-value threshold for operations review, in the default market currency.',
   '{"data":25000}'::jsonb, 'number', false, false, 10)
on conflict (key) do nothing;

update public.app_settings
set value = '{"data":"banglablend@gmail.com"}'::jsonb
where key = 'support.email'
  and value = '{"data":"hello@example.com"}'::jsonb;

update public.app_settings
set value = '{"data":"https://bpanel.banglablend.store/content"}'::jsonb
where key = 'content.studio_url'
  and value ->> 'data' like 'http://localhost:%';

-- Replace development SKU prefixes in the reviewed catalog bootstrap.
update public.product_variants
set sku = case sku
  when 'SAMPLE-SHA-75' then 'BB-SGM-075'
  when 'SAMPLE-SHA-80' then 'BB-SGM-080'
  when 'SAMPLE-SHA-100' then 'BB-SGM-100'
  when 'SAMPLE-BLK-70' then 'BB-BLP-070'
  when 'SAMPLE-BLK-75' then 'BB-BLP-075'
  when 'SAMPLE-HTZ-60' then 'BB-HRC-060'
  when 'SAMPLE-HTZ-100' then 'BB-HRC-100'
  when 'SAMPLE-HTZ-125' then 'BB-HRC-125'
  when 'SAMPLE-FSH-75' then 'BB-CFM-075'
  when 'SAMPLE-FSH-80' then 'BB-CFM-080'
  when 'SAMPLE-FSH-100' then 'BB-CFM-100'
  when 'SAMPLE-MEZ-75' then 'BB-MEZ-075'
  when 'SAMPLE-MEZ-80' then 'BB-MEZ-080'
  when 'SAMPLE-MEZ-100' then 'BB-MEZ-100'
  when 'SAMPLE-WPP-70' then 'BB-WPP-070'
  when 'SAMPLE-WPP-75' then 'BB-WPP-075'
  else sku
end
where sku in (
  'SAMPLE-SHA-75', 'SAMPLE-SHA-80', 'SAMPLE-SHA-100',
  'SAMPLE-BLK-70', 'SAMPLE-BLK-75',
  'SAMPLE-HTZ-60', 'SAMPLE-HTZ-100', 'SAMPLE-HTZ-125',
  'SAMPLE-FSH-75', 'SAMPLE-FSH-80', 'SAMPLE-FSH-100',
  'SAMPLE-MEZ-75', 'SAMPLE-MEZ-80', 'SAMPLE-MEZ-100',
  'SAMPLE-WPP-70', 'SAMPLE-WPP-75'
);

-- The bootstrap imports no carts, so these two historical reservations must not carry over.
update public.inventory_levels
set reserved_quantity = 0
where (id = 'a8950c2f-e4a1-4d13-b7e8-c897c60017e6'::uuid and reserved_quantity = 2)
   or (id = 'd572de2d-d3cf-408f-93fd-45cc0169a721'::uuid and reserved_quantity = 1);
