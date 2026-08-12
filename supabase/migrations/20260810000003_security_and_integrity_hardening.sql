-- Production hardening found during the admin-panel readiness audit.

-- These checkout functions are called only by the storefront's server-side service-role client.
-- Postgres grants EXECUTE to PUBLIC for new functions unless explicitly revoked, which allowed an
-- anonymous API caller with a guessed cart UUID to bypass the intended server boundary.
revoke all on function cart_add_line_item(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function cart_set_line_item_quantity(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function cart_remove_line_item(uuid, uuid) from public, anon, authenticated;
revoke all on function complete_cart(uuid) from public, anon, authenticated;

grant execute on function cart_add_line_item(uuid, uuid, integer) to service_role;
grant execute on function cart_set_line_item_quantity(uuid, uuid, integer) to service_role;
grant execute on function cart_remove_line_item(uuid, uuid) to service_role;
grant execute on function complete_cart(uuid) to service_role;

-- Preserve the operational progression even if a future write path misses application validation.
alter table inventory_levels
  add constraint inventory_reserved_not_above_stocked
  check (reserved_quantity <= stocked_quantity) not valid;
alter table inventory_levels validate constraint inventory_reserved_not_above_stocked;

alter table order_line_items
  add constraint order_line_item_quantity_progression
  check (
    fulfilled_quantity between 0 and quantity
    and shipped_quantity between 0 and fulfilled_quantity
    and delivered_quantity between 0 and shipped_quantity
  ) not valid;
alter table order_line_items validate constraint order_line_item_quantity_progression;

-- Fulfillment is the point at which physical stock leaves the warehouse. Keep that adjustment in
-- the database transaction that creates fulfillment items so an application crash cannot mark an
-- item packed without consuming inventory (or consume inventory without the fulfillment record).
create or replace function allocate_fulfillment_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant_id uuid;
  v_manage_inventory boolean;
  v_level inventory_levels;
begin
  select oli.variant_id, pv.manage_inventory
    into v_variant_id, v_manage_inventory
  from order_line_items oli
  left join product_variants pv on pv.id = oli.variant_id
  where oli.id = new.line_item_id;

  if v_variant_id is null or not coalesce(v_manage_inventory, true) then
    return new;
  end if;

  select il.* into v_level
  from inventory_levels il
  join stock_locations sl on sl.id = il.location_id and sl.is_primary
  where il.variant_id = v_variant_id
  for update of il;

  if not found then
    raise exception 'No primary-location inventory exists for variant %.', v_variant_id;
  end if;
  if v_level.stocked_quantity < new.quantity then
    raise exception 'Insufficient stock for variant %: % available, % requested.', v_variant_id, v_level.stocked_quantity, new.quantity;
  end if;

  update inventory_levels
  set stocked_quantity = stocked_quantity - new.quantity,
      reserved_quantity = greatest(0, reserved_quantity - new.quantity)
  where id = v_level.id;

  return new;
end;
$$;

revoke all on function allocate_fulfillment_inventory() from public, anon, authenticated;

create trigger fulfillment_items_allocate_inventory
  before insert on fulfillment_items
  for each row execute function allocate_fulfillment_inventory();
