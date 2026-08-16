-- Soft-deleted variants must disappear from every anonymous storefront read. The application
-- also filters them explicitly, while these policies protect any current or future public query.
drop policy if exists "public read variants of visible products" on public.product_variants;
create policy "public read variants of visible products" on public.product_variants for select
  using (
    deleted_at is null
    and exists (
      select 1 from public.products p
      where p.id = product_variants.product_id
        and p.status = 'published'
        and p.verified
        and p.deleted_at is null
    )
  );

drop policy if exists "public read prices of visible variants" on public.product_prices;
create policy "public read prices of visible variants" on public.product_prices for select
  using (exists (
    select 1 from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = product_prices.variant_id
      and v.deleted_at is null
      and p.status = 'published'
      and p.verified
      and p.deleted_at is null
  ));

drop policy if exists "public read inventory of visible products" on public.inventory_levels;
create policy "public read inventory of visible products" on public.inventory_levels for select
  using (exists (
    select 1 from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = inventory_levels.variant_id
      and v.deleted_at is null
      and p.status = 'published'
      and p.verified
      and p.deleted_at is null
  ));
