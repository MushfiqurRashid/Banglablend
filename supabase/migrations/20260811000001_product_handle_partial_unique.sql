-- products.handle was globally unique, including soft-deleted rows. Deleting a product only sets
-- deleted_at, so the removed row kept its handle reserved forever: re-creating a product under a
-- handle that had ever been used failed with products_handle_key. Scope uniqueness to live rows
-- only, matching product_variants.sku and the existing partial indexes on this table.
alter table public.products drop constraint products_handle_key;
create unique index products_handle_key on public.products (handle) where deleted_at is null;
