-- Migrated customers and orders. See 001_migrated_dev_data.sql for scope notes and the uuid
-- mapping convention. auth_user_id is left NULL for every customer: none of these five source
-- rows has a Supabase Auth login yet (they were Medusa-native customer records, some created via
-- guest checkout). Linking happens naturally the next time each person signs in with a matching
-- email, via whatever "claim guest orders on signup" logic Phase 2 implements.

begin;

insert into customers (id, email, first_name, last_name, metadata, created_at, updated_at) values
  (md5('customer:cus_01KYMPWVC516P6C7FR00VGS1BY')::uuid, 'sample.customer@example.invalid', 'Sample', 'Customer',
   '{"legacy_id": "cus_01KYMPWVC516P6C7FR00VGS1BY", "test_data": true, "isPlaceholder": true}', '2026-07-28T15:53:34.342+00', '2026-07-28T15:53:34.342+00'),
  (md5('customer:cus_01KYPABG1BANA4GSHC54KCFBK3')::uuid, 'mushfiqur.tech@gmail.com', null, null,
   '{"legacy_id": "cus_01KYPABG1BANA4GSHC54KCFBK3"}', '2026-07-29T06:52:51.634+00', '2026-07-29T06:52:51.634+00'),
  (md5('customer:cus_01KZ5YDX91EC8K3YKXWWFNX0XH')::uuid, 'codex.checkout.test@example.com', null, null,
   '{"legacy_id": "cus_01KZ5YDX91EC8K3YKXWWFNX0XH"}', '2026-08-04T08:32:18.723+00', '2026-08-04T08:32:18.723+00'),
  (md5('customer:cus_01KZ5Z6DBCF8WR30R8SXAMF6VX')::uuid, 'checkout-smoke@banglablend.local', null, null,
   '{"legacy_id": "cus_01KZ5Z6DBCF8WR30R8SXAMF6VX"}', '2026-08-04T08:45:41.615+00', '2026-08-04T08:45:41.615+00'),
  (md5('customer:cus_01KZBCA95ZNFA8Z7EB5MNEWJ7N')::uuid, 'mushfiqur.tech@gmail.com', 'Mushfiqur', 'Rashid',
   '{"legacy_id": "cus_01KZBCA95ZNFA8Z7EB5MNEWJ7N"}', '2026-08-06T11:11:12.064+00', '2026-08-06T11:11:12.064+00');

-- Carts (completed) --------------------------------------------------------------------------
-- Each of the 4 orders below traces back to the cart it was placed from (order_cart link table
-- in the source database). Inserted here, completed, so orders.cart_id and
-- order_gift_details.cart_id have somewhere real to point.

insert into carts (id, customer_id, region_id, email, currency_code, completed_at, created_at, updated_at) values
  (md5('cart:cart_01KZ5Z65YWN5C619E6FA9WBNXW')::uuid, md5('customer:cus_01KZ5Z6DBCF8WR30R8SXAMF6VX')::uuid,
   md5('region:reg_01KYMKFRFF0C3TFP0SGAE93DV9')::uuid, 'checkout-smoke@banglablend.local', 'bdt',
   '2026-08-04T08:45:57.696+00', '2026-08-04T08:45:44.431+00', '2026-08-04T08:45:57.696+00'),
  (md5('cart:cart_01KZ5ZER657KZ5FY5RR368DDDJ')::uuid, md5('customer:cus_01KZ5Z6DBCF8WR30R8SXAMF6VX')::uuid,
   md5('region:reg_01KYMKFRFF0C3TFP0SGAE93DV9')::uuid, 'checkout-smoke@banglablend.local', 'bdt',
   '2026-08-04T08:50:31.981+00', '2026-08-04T08:50:28.772+00', '2026-08-04T08:50:31.981+00'),
  (md5('cart:cart_01KZ63DNKJPGMW6267BVB4JBKN')::uuid, md5('customer:cus_01KYPABG1BANA4GSHC54KCFBK3')::uuid,
   md5('region:reg_01KYMKFRFF0C3TFP0SGAE93DV9')::uuid, 'mushfiqur.tech@gmail.com', 'bdt',
   '2026-08-04T10:04:30.334+00', '2026-08-04T10:04:18.222+00', '2026-08-04T10:04:30.334+00'),
  (md5('cart:cart_01KZB8DNW5SCY1V9M8V0VHZYHB')::uuid, md5('customer:cus_01KYPABG1BANA4GSHC54KCFBK3')::uuid,
   md5('region:reg_01KYMKFRFF0C3TFP0SGAE93DV9')::uuid, 'mushfiqur.tech@gmail.com', 'bdt',
   '2026-08-06T10:03:35.187+00', '2026-08-06T10:03:33.465+00', '2026-08-06T10:03:35.187+00');

-- Orders -----------------------------------------------------------------------------------------
-- payment_status / fulfillment_status did not exist as stored columns on Medusa's `order` table --
-- they were derived from linked payment_collection / order_item state at read time. Derived here
-- the same way buildOrderWorkflowView() would: pp_system_default => COD; payment ready when
-- authorized/captured; fulfillment_status from line item fulfilled_quantity vs quantity.

insert into orders (id, display_id, cart_id, customer_id, email, region_id, currency_code, status,
    payment_status, fulfillment_status, subtotal, shipping_total, total, is_gift, metadata,
    created_at, updated_at) values
  (md5('order:order_01KZ5Z6X1H2N39AFSAJNE27JPT')::uuid, 1, md5('cart:cart_01KZ5Z65YWN5C619E6FA9WBNXW')::uuid, md5('customer:cus_01KZ5Z6DBCF8WR30R8SXAMF6VX')::uuid,
   'checkout-smoke@banglablend.local', md5('region:reg_01KYMKFRFF0C3TFP0SGAE93DV9')::uuid, 'bdt',
   'pending', 'authorized', 'not_fulfilled', 200, 80, 280, true,
   '{"legacy_id": "order_01KZ5Z6X1H2N39AFSAJNE27JPT", "market": "bd"}',
   '2026-08-04T08:45:57.696+00', '2026-08-04T08:45:57.696+00'),

  (md5('order:order_01KZ5ZF8X68M6SH3B0VMJNYWRW')::uuid, 2, md5('cart:cart_01KZ5ZER657KZ5FY5RR368DDDJ')::uuid, md5('customer:cus_01KZ5Z6DBCF8WR30R8SXAMF6VX')::uuid,
   'checkout-smoke@banglablend.local', md5('region:reg_01KYMKFRFF0C3TFP0SGAE93DV9')::uuid, 'bdt',
   'pending', 'authorized', 'not_fulfilled', 200, 80, 280, true,
   '{"legacy_id": "order_01KZ5ZF8X68M6SH3B0VMJNYWRW", "market": "bd"}',
   '2026-08-04T08:50:31.981+00', '2026-08-04T08:50:31.981+00'),

  (md5('order:order_01KZ63PQ7SRJ1VHDD0XM429PZ0')::uuid, 3, md5('cart:cart_01KZ63DNKJPGMW6267BVB4JBKN')::uuid, md5('customer:cus_01KYPABG1BANA4GSHC54KCFBK3')::uuid,
   'mushfiqur.tech@gmail.com', md5('region:reg_01KYMKFRFF0C3TFP0SGAE93DV9')::uuid, 'bdt',
   'pending', 'authorized', 'not_fulfilled', 250, 80, 330, false,
   '{"legacy_id": "order_01KZ63PQ7SRJ1VHDD0XM429PZ0", "market": "bd", "payment_method": "cod"}',
   '2026-08-04T10:04:30.334+00', '2026-08-04T10:04:30.334+00'),

  (md5('order:order_01KZB8EFC2NGAMAPT1Y2AX7GBZ')::uuid, 4, md5('cart:cart_01KZB8DNW5SCY1V9M8V0VHZYHB')::uuid, md5('customer:cus_01KYPABG1BANA4GSHC54KCFBK3')::uuid,
   'mushfiqur.tech@gmail.com', md5('region:reg_01KYMKFRFF0C3TFP0SGAE93DV9')::uuid, 'bdt',
   'pending', 'captured', 'fulfilled', 200, 80, 280, false,
   '{"legacy_id": "order_01KZB8EFC2NGAMAPT1Y2AX7GBZ", "market": "bd", "payment_method": "cod"}',
   '2026-08-06T10:03:35.187+00', '2026-08-06T11:08:40.13+00');

insert into order_line_items (order_id, variant_id, product_id, title, sku, quantity, unit_price, fulfilled_quantity, shipped_quantity) values
  (md5('order:order_01KZ5Z6X1H2N39AFSAJNE27JPT')::uuid, md5('variant:variant_01KYPPZGM323JG3PF0J7V4XHSE')::uuid,
   md5('product:prod_01KYMPWTR90XC1QDM7B52VVG8A')::uuid, 'Mezban Masala', 'SAMPLE-MEZ-75', 1, 200, 0, 0),

  (md5('order:order_01KZ5ZF8X68M6SH3B0VMJNYWRW')::uuid, md5('variant:variant_01KYPPZGM323JG3PF0J7V4XHSE')::uuid,
   md5('product:prod_01KYMPWTR90XC1QDM7B52VVG8A')::uuid, 'Mezban Masala', 'SAMPLE-MEZ-75', 1, 200, 0, 0),

  (md5('order:order_01KZ63PQ7SRJ1VHDD0XM429PZ0')::uuid, md5('variant:variant_01KYPPZHRXYFT5RH58R9NB7QXZ')::uuid,
   md5('product:prod_01KYPKY0RWWNRWVTHK2F8FKV7W')::uuid, 'Black Pepper', 'SAMPLE-BLK-75', 1, 250, 0, 0),

  (md5('order:order_01KZB8EFC2NGAMAPT1Y2AX7GBZ')::uuid, md5('variant:variant_01KZB74T1EGG3QQ8GE2KKEGM7P')::uuid,
   md5('product:prod_01KZB74SMJP7DGVSFYREDPM7BZ')::uuid, 'new masala', 'NEW_MASALA-100_G', 1, 200, 1, 0);

insert into order_addresses (order_id, address_type, first_name, last_name, address_1, address_2, city, province, postal_code, country_code, phone) values
  (md5('order:order_01KZ5Z6X1H2N39AFSAJNE27JPT')::uuid, 'shipping', 'Checkout', 'Verification', '1 Test Road', '', 'Dhaka', 'Dhaka', '1205', 'bd', '01700000000'),
  (md5('order:order_01KZ5Z6X1H2N39AFSAJNE27JPT')::uuid, 'billing', 'Checkout', 'Verification', '1 Test Road', '', 'Dhaka', 'Dhaka', '1205', 'bd', '01700000000'),

  (md5('order:order_01KZ5ZF8X68M6SH3B0VMJNYWRW')::uuid, 'shipping', 'Checkout', 'Verification', '1 Test Road', '', 'Dhaka', 'Dhaka', '1205', 'bd', '01700000000'),
  (md5('order:order_01KZ5ZF8X68M6SH3B0VMJNYWRW')::uuid, 'billing', 'Checkout', 'Verification', '1 Test Road', '', 'Dhaka', 'Dhaka', '1205', 'bd', '01700000000'),

  (md5('order:order_01KZ63PQ7SRJ1VHDD0XM429PZ0')::uuid, 'shipping', 'Mushfiqur', 'Rashid', 'road 9', '', 'Dhaka', '', '1229', 'bd', '+8801720097317'),
  (md5('order:order_01KZ63PQ7SRJ1VHDD0XM429PZ0')::uuid, 'billing', 'Mushfiqur', 'Rashid', 'road 9', '', 'Dhaka', '', '1229', 'bd', '+8801720097317'),

  (md5('order:order_01KZB8EFC2NGAMAPT1Y2AX7GBZ')::uuid, 'shipping', 'Mushfiqur', 'Rashid', 'road 9', '', 'Dhaka', '', '1229', 'bd', '+8801720097317'),
  (md5('order:order_01KZB8EFC2NGAMAPT1Y2AX7GBZ')::uuid, 'billing', 'Mushfiqur', 'Rashid', 'road 9', '', 'Dhaka', '', '1229', 'bd', '+8801720097317');

-- Gift details for the two gift orders (recipient captured at checkout, from order.metadata.recipient) --

insert into order_gift_details (cart_id, order_id, recipient_name, recipient_telephone, gift_message, hide_prices, delivery_instructions) values
  (md5('cart:cart_01KZ5Z65YWN5C619E6FA9WBNXW')::uuid, md5('order:order_01KZ5Z6X1H2N39AFSAJNE27JPT')::uuid,
   'Order Test Recipient', '01800000000', 'Checkout integration test', true, 'Automated verification order — do not fulfill'),
  (md5('cart:cart_01KZ5ZER657KZ5FY5RR368DDDJ')::uuid, md5('order:order_01KZ5ZF8X68M6SH3B0VMJNYWRW')::uuid,
   'Order Test Recipient', '01800000000', 'Checkout integration test', true, 'Automated verification order — do not fulfill');

-- Payment collections / sessions / payments ------------------------------------------------------
-- pp_system_default is this app's Cash-on-Delivery provider (see buildOrderWorkflowView's isCod
-- check in the legacy Medusa code) -> mapped to 'cod'.

insert into payment_collections (id, order_id, amount, currency_code, status) values
  (gen_random_uuid(), md5('order:order_01KZ5Z6X1H2N39AFSAJNE27JPT')::uuid, 280, 'bdt', 'authorized'),
  (gen_random_uuid(), md5('order:order_01KZ5ZF8X68M6SH3B0VMJNYWRW')::uuid, 280, 'bdt', 'authorized'),
  (gen_random_uuid(), md5('order:order_01KZ63PQ7SRJ1VHDD0XM429PZ0')::uuid, 330, 'bdt', 'authorized'),
  (gen_random_uuid(), md5('order:order_01KZB8EFC2NGAMAPT1Y2AX7GBZ')::uuid, 280, 'bdt', 'completed');

insert into payment_sessions (id, payment_collection_id, provider, status, data) values
  (gen_random_uuid(), (select id from payment_collections where order_id = md5('order:order_01KZ5Z6X1H2N39AFSAJNE27JPT')::uuid), 'cod', 'authorized', '{}'),
  (gen_random_uuid(), (select id from payment_collections where order_id = md5('order:order_01KZ5ZF8X68M6SH3B0VMJNYWRW')::uuid), 'cod', 'authorized', '{}'),
  (gen_random_uuid(), (select id from payment_collections where order_id = md5('order:order_01KZ63PQ7SRJ1VHDD0XM429PZ0')::uuid), 'cod', 'authorized', '{}'),
  (gen_random_uuid(), (select id from payment_collections where order_id = md5('order:order_01KZB8EFC2NGAMAPT1Y2AX7GBZ')::uuid), 'cod', 'authorized', '{}');

insert into payments (id, payment_session_id, provider, amount, currency_code, captured_amount, status, created_at) values
  (gen_random_uuid(), (select id from payment_sessions where payment_collection_id = (select id from payment_collections where order_id = md5('order:order_01KZ5Z6X1H2N39AFSAJNE27JPT')::uuid)), 'cod', 280, 'bdt', 0, 'authorized', '2026-08-04T08:45:57.696+00'),
  (gen_random_uuid(), (select id from payment_sessions where payment_collection_id = (select id from payment_collections where order_id = md5('order:order_01KZ5ZF8X68M6SH3B0VMJNYWRW')::uuid)), 'cod', 280, 'bdt', 0, 'authorized', '2026-08-04T08:50:31.981+00'),
  (gen_random_uuid(), (select id from payment_sessions where payment_collection_id = (select id from payment_collections where order_id = md5('order:order_01KZ63PQ7SRJ1VHDD0XM429PZ0')::uuid)), 'cod', 330, 'bdt', 0, 'authorized', '2026-08-04T10:04:30.334+00'),
  (gen_random_uuid(), (select id from payment_sessions where payment_collection_id = (select id from payment_collections where order_id = md5('order:order_01KZB8EFC2NGAMAPT1Y2AX7GBZ')::uuid)), 'cod', 280, 'bdt', 280, 'captured', '2026-08-06T10:03:35.187+00');

-- Fulfillment for order 4 (the only order that was ever advanced past "placed") ------------------

insert into fulfillments (id, order_id, packed_at, shipped_at, delivered_at, created_at) values
  (gen_random_uuid(), md5('order:order_01KZB8EFC2NGAMAPT1Y2AX7GBZ')::uuid, '2026-08-06T11:08:40.13+00', null, null, '2026-08-06T11:08:40.13+00');

insert into fulfillment_items (fulfillment_id, line_item_id, quantity)
  select f.id, oli.id, 1
  from fulfillments f
  join order_line_items oli on oli.order_id = f.order_id
  where f.order_id = md5('order:order_01KZB8EFC2NGAMAPT1Y2AX7GBZ')::uuid;

-- The inserts above set display_id explicitly (preserving order_01..order_04 from the source
-- system) rather than letting the column default draw from order_display_number_seq, so the
-- sequence itself was never advanced. Without this, the next real checkout would collide with
-- display_id 1 the first time nextval() is called.
select setval('order_display_number_seq', (select max(display_id) from orders));

commit;
