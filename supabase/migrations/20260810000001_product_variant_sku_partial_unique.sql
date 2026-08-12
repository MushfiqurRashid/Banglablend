-- product_variants.sku was globally unique, including soft-deleted rows. Editing a product
-- re-creates its variants (old rows soft-deleted, new rows inserted), so re-saving a product
-- without changing its SKU collided with its own just-deleted variant and failed partway
-- through, leaving the product with no live variants. Scope uniqueness to live rows only,
-- matching the existing partial index on product_id.
alter table public.product_variants drop constraint product_variants_sku_key;
create unique index product_variants_sku_key on public.product_variants (sku) where deleted_at is null;
