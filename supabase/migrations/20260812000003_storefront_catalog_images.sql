-- Custom storefront catalogs need two distinct visual treatments: a compact image in the
-- desktop navigation and a wide image in the catalog page header. Keep both URLs and their
-- accessibility text on the catalog record so moving a catalog between sections retains media.
alter table public.storefront_catalogs
  add column if not exists navigation_image_url text,
  add column if not exists navigation_image_alt text,
  add column if not exists hero_image_url text,
  add column if not exists hero_image_alt text;

-- Catalog media is public because it is rendered in storefront navigation and public landing
-- pages. Uploads and changes remain restricted to staff who can manage the product catalog.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-images', 'catalog-images', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "staff manage catalog images" on storage.objects for all
  using (bucket_id = 'catalog-images' and has_permission('catalog', 'manage'))
  with check (bucket_id = 'catalog-images' and has_permission('catalog', 'manage'));
