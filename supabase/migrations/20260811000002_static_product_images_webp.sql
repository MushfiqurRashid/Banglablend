-- Keep existing catalog and immutable line-item snapshots aligned with the compressed
-- storefront assets. These six PNG files were replaced by equivalent WebP files.

update products
set thumbnail_url = regexp_replace(thumbnail_url, '\.png$', '.webp')
where thumbnail_url in (
  '/images/products/black-pepper-product.png',
  '/images/products/coxs-bazar-fish-masala-product.png',
  '/images/products/hathazari-red-chilli-product.png',
  '/images/products/mezban-masala-product.png',
  '/images/products/shahi-garam-masala-product.png',
  '/images/products/white-pepper-powder-product.png'
);

update cart_line_items
set thumbnail_url = regexp_replace(thumbnail_url, '\.png$', '.webp')
where thumbnail_url in (
  '/images/products/black-pepper-product.png',
  '/images/products/coxs-bazar-fish-masala-product.png',
  '/images/products/hathazari-red-chilli-product.png',
  '/images/products/mezban-masala-product.png',
  '/images/products/shahi-garam-masala-product.png',
  '/images/products/white-pepper-powder-product.png'
);

update order_line_items
set thumbnail_url = regexp_replace(thumbnail_url, '\.png$', '.webp')
where thumbnail_url in (
  '/images/products/black-pepper-product.png',
  '/images/products/coxs-bazar-fish-masala-product.png',
  '/images/products/hathazari-red-chilli-product.png',
  '/images/products/mezban-masala-product.png',
  '/images/products/shahi-garam-masala-product.png',
  '/images/products/white-pepper-powder-product.png'
);
