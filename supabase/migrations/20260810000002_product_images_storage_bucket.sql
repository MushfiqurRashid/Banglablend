-- Public bucket for product thumbnails/gallery images uploaded from the admin product editor.
-- Public read (product images need to render on the storefront without auth); writes are
-- restricted to staff with catalog:manage, same permission that gates writing the products table
-- itself.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "staff manage product images" on storage.objects for all
  using (bucket_id = 'product-images' and has_permission('catalog', 'manage'))
  with check (bucket_id = 'product-images' and has_permission('catalog', 'manage'));
