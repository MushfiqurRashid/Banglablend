-- Cart and checkout RPCs. Called from trusted server code (Next.js route handlers using the
-- service role client) so these are the only place cart mutation and order-placement logic lives,
-- mirroring how the old storefront never let the browser talk to Medusa directly for money-moving
-- operations. security definer + a fixed search_path keeps behavior consistent regardless of caller.

create or replace function cart_add_line_item(p_cart_id uuid, p_variant_id uuid, p_quantity int)
returns cart_line_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart carts;
  v_variant product_variants;
  v_product products;
  v_price product_prices;
  v_line cart_line_items;
begin
  select * into v_cart from carts where id = p_cart_id and completed_at is null;
  if not found then
    raise exception 'Cart % not found or already completed.', p_cart_id;
  end if;

  select * into v_variant from product_variants where id = p_variant_id and deleted_at is null;
  if not found then
    raise exception 'Variant % not found.', p_variant_id;
  end if;

  select * into v_product from products where id = v_variant.product_id and deleted_at is null;
  select * into v_price from product_prices where variant_id = p_variant_id and currency_code = v_cart.currency_code;
  if not found then
    raise exception 'No % price is configured for variant %.', v_cart.currency_code, p_variant_id;
  end if;

  insert into cart_line_items (cart_id, variant_id, product_id, title, variant_title, thumbnail_url, quantity, unit_price, currency_code)
  values (p_cart_id, p_variant_id, v_variant.product_id, v_product.title, v_variant.title, v_product.thumbnail_url, p_quantity, v_price.amount, v_cart.currency_code)
  on conflict (cart_id, variant_id)
  do update set quantity = cart_line_items.quantity + excluded.quantity, updated_at = now()
  returning * into v_line;

  return v_line;
end;
$$;

create or replace function cart_set_line_item_quantity(p_cart_id uuid, p_line_id uuid, p_quantity int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update cart_line_items set quantity = p_quantity, updated_at = now()
  where id = p_line_id and cart_id = p_cart_id;
  if not found then
    raise exception 'Cart line % not found on cart %.', p_line_id, p_cart_id;
  end if;
end;
$$;

create or replace function cart_remove_line_item(p_cart_id uuid, p_line_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from cart_line_items where id = p_line_id and cart_id = p_cart_id;
end;
$$;

-- Completes a cart into an order: copies line items, addresses, and shipping total; marks the
-- cart completed; and (when the cart carries gift metadata) creates the linked gift-order record.
-- Mirrors Medusa's `/store/carts/:id/complete` in scope: it does not touch payment state, which
-- the caller sets separately once the payment session result is known.
create or replace function complete_cart(p_cart_id uuid)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart carts;
  v_shipping cart_shipping_methods;
  v_order orders;
  v_subtotal numeric(12, 2);
  v_recipient jsonb;
begin
  select * into v_cart from carts where id = p_cart_id for update;
  if not found then
    raise exception 'Cart % not found.', p_cart_id;
  end if;
  if v_cart.completed_at is not null then
    raise exception 'Cart % has already been completed.', p_cart_id;
  end if;

  select coalesce(sum(quantity * unit_price), 0) into v_subtotal from cart_line_items where cart_id = p_cart_id;
  select * into v_shipping from cart_shipping_methods where cart_id = p_cart_id;

  insert into orders (cart_id, customer_id, email, region_id, currency_code, is_gift, metadata, subtotal, shipping_total, total)
  values (
    p_cart_id, v_cart.customer_id, v_cart.email, v_cart.region_id, v_cart.currency_code,
    coalesce((v_cart.metadata->>'is_gift')::boolean, false), v_cart.metadata,
    v_subtotal, coalesce(v_shipping.amount, 0), v_subtotal + coalesce(v_shipping.amount, 0)
  )
  returning * into v_order;

  insert into order_line_items (order_id, variant_id, product_id, title, variant_title, thumbnail_url, sku, quantity, unit_price)
  select v_order.id, cli.variant_id, cli.product_id, cli.title, cli.variant_title, cli.thumbnail_url, pv.sku, cli.quantity, cli.unit_price
  from cart_line_items cli
  join product_variants pv on pv.id = cli.variant_id
  where cli.cart_id = p_cart_id;

  insert into order_addresses (order_id, address_type, first_name, last_name, company, address_1, address_2, city, province, postal_code, country_code, phone)
  select v_order.id, ca.address_type, ca.first_name, ca.last_name, ca.company, ca.address_1, ca.address_2, ca.city, ca.province, ca.postal_code, ca.country_code, ca.phone
  from cart_addresses ca
  where ca.cart_id = p_cart_id;

  v_recipient := v_cart.metadata->'recipient';
  if v_recipient is not null then
    insert into order_gift_details (cart_id, order_id, recipient_name, recipient_telephone, gift_message, hide_prices, preferred_delivery_date, delivery_instructions, occasion, corporate_order_reference)
    values (
      p_cart_id, v_order.id,
      v_recipient->>'name', v_recipient->>'telephone', v_recipient->>'message',
      coalesce((v_recipient->>'hidePrices')::boolean, false),
      nullif(v_recipient->>'preferredDeliveryDate', '')::date,
      v_recipient->>'instructions', v_recipient->>'occasion', v_recipient->>'corporateOrderReference'
    )
    on conflict (cart_id) do update set order_id = excluded.order_id;
  end if;

  update carts set completed_at = now(), updated_at = now() where id = p_cart_id;

  return v_order;
end;
$$;
