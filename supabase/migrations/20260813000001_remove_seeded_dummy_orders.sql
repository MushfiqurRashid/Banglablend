-- Remove the four development orders that were previously loaded by
-- a retired development order fixture. Keep this migration exact-ID based so applying it
-- to an existing environment can never remove genuine checkout orders.

begin;

create temporary table dummy_order_ids (id uuid primary key) on commit drop;
insert into dummy_order_ids (id) values
  (md5('order:order_01KZ5Z6X1H2N39AFSAJNE27JPT')::uuid),
  (md5('order:order_01KZ5ZF8X68M6SH3B0VMJNYWRW')::uuid),
  (md5('order:order_01KZ63PQ7SRJ1VHDD0XM429PZ0')::uuid),
  (md5('order:order_01KZB8EFC2NGAMAPT1Y2AX7GBZ')::uuid);

-- Payments restrict deletion of their sessions, while sessions cascade from collections.
delete from payments
where payment_session_id in (
  select ps.id
  from payment_sessions ps
  join payment_collections pc on pc.id = ps.payment_collection_id
  where pc.order_id in (select id from dummy_order_ids)
);

delete from payment_collections
where order_id in (select id from dummy_order_ids);

-- Fulfillment items reference order lines with ON DELETE RESTRICT, so remove their parent
-- fulfillments before the order cascade reaches the line items.
delete from fulfillments
where order_id in (select id from dummy_order_ids);

-- Order lines and addresses cascade from orders. Gift details cascade when their completed
-- development carts are removed below.
delete from orders
where id in (select id from dummy_order_ids);

delete from carts
where id in (
  md5('cart:cart_01KZ5Z65YWN5C619E6FA9WBNXW')::uuid,
  md5('cart:cart_01KZ5ZER657KZ5FY5RR368DDDJ')::uuid,
  md5('cart:cart_01KZ63DNKJPGMW6267BVB4JBKN')::uuid,
  md5('cart:cart_01KZB8DNW5SCY1V9M8V0VHZYHB')::uuid
);

-- This is the one append-only audit row created for a seeded order. Temporarily disabling the
-- delete guard is intentionally scoped to the exact legacy order reference.
alter table admin_audit_log disable trigger admin_audit_log_forbid_delete;
delete from admin_audit_log
where resource_type = 'order'
  and resource_id = 'order_01KZB8EFC2NGAMAPT1Y2AX7GBZ'
  and request_id = '0e415413-5831-4f9a-9dd7-a7da6cdfa5a9';
alter table admin_audit_log enable trigger admin_audit_log_forbid_delete;

-- Remove only unmistakable test customers, and only if they were never linked to Auth or used by
-- another cart/order. Personal customer records are deliberately preserved.
delete from customers c
where c.auth_user_id is null
  and (
    c.email in (
      'sample.customer@example.invalid',
      'codex.checkout.test@example.com',
      'checkout-smoke@banglablend.local'
    )
    or c.metadata @> '{"test_data": true}'::jsonb
  )
  and not exists (select 1 from orders o where o.customer_id = c.id)
  and not exists (select 1 from carts ca where ca.customer_id = c.id);

-- Preserve the next genuine order number when other orders exist; otherwise start at order_01.
select setval(
  'order_display_number_seq',
  greatest(coalesce((select max(display_id) from orders), 1), 1),
  exists (select 1 from orders)
);

commit;
