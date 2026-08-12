-- inventory_levels previously had staff-only read access (has_permission('catalog','view')), but
-- the storefront's own commerce-client needs stock levels to decide whether "Add to Cart" should
-- be enabled for a published, verified product -- discovered by actually running the storefront
-- against real data: every product's inventory_levels came back empty to the anon key, so every
-- add-to-cart button was permanently disabled regardless of real stock.
--
-- Scope matches the existing "public read variants of visible products" policy in
-- ..._row_level_security.sql: only inventory for variants belonging to a published+verified,
-- non-deleted product is exposed -- draft/unverified products' stock stays staff-only.
create policy "public read inventory of visible products" on inventory_levels for select
  using (exists (
    select 1 from product_variants v
    join products p on p.id = v.product_id
    where v.id = inventory_levels.variant_id and p.status = 'published' and p.verified and p.deleted_at is null
  ));
