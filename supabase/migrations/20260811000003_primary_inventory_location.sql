-- Fulfillment consumes stock exclusively from the primary location. Earlier migrated catalog
-- inventory retained its legacy sample-warehouse location, which made stocked variants
-- impossible to fulfill. Merge any duplicate levels, then move remaining managed inventory to
-- the primary warehouse while preserving quantities and reservations.

do $$
declare
  primary_location_id uuid;
begin
  select id into primary_location_id
  from stock_locations
  where is_primary
  limit 1;

  if primary_location_id is null then
    if exists (select 1 from inventory_levels) then
      raise exception 'Inventory exists but no primary stock location is configured.';
    end if;
    return;
  end if;

  with source_totals as (
    select source.variant_id,
           sum(source.stocked_quantity)::int as stocked_quantity,
           sum(source.reserved_quantity)::int as reserved_quantity
    from inventory_levels source
    where source.location_id <> primary_location_id
      and exists (
        select 1
        from inventory_levels target
        where target.variant_id = source.variant_id
          and target.location_id = primary_location_id
      )
    group by source.variant_id
  )
  update inventory_levels target
  set stocked_quantity = target.stocked_quantity + source_totals.stocked_quantity,
      reserved_quantity = target.reserved_quantity + source_totals.reserved_quantity
  from source_totals
  where target.variant_id = source_totals.variant_id
    and target.location_id = primary_location_id;

  delete from inventory_levels source
  where source.location_id <> primary_location_id
    and exists (
      select 1
      from inventory_levels target
      where target.variant_id = source.variant_id
        and target.location_id = primary_location_id
    );

  update inventory_levels
  set location_id = primary_location_id
  where location_id <> primary_location_id;
end;
$$;
