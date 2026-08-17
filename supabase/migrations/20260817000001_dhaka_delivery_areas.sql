-- Checkout offers an explicit delivery-area choice. The existing production option keeps its
-- stable id so carts or historical references remain valid; only its customer-facing label is
-- made specific. The second stable option adds the outside-Dhaka charge.
update public.shipping_options
set
  name = 'Inside Dhaka',
  amount = 80,
  currency_code = 'bdt',
  provider = 'manual',
  is_active = true,
  metadata = jsonb_build_object('delivery_area', 'inside_dhaka'),
  updated_at = now()
where id = '08a70e0b-5cd9-806a-d386-a61ec0694ea0';

insert into public.shipping_options (
  id,
  region_id,
  name,
  amount,
  currency_code,
  provider,
  is_active,
  metadata
)
select
  'd814004c-4d6d-4ed2-9e06-a5e17b24820a',
  id,
  'Outside Dhaka',
  120,
  'bdt',
  'manual',
  true,
  jsonb_build_object('delivery_area', 'outside_dhaka')
from public.regions
where market_code = 'bd'
on conflict (id) do update set
  region_id = excluded.region_id,
  name = excluded.name,
  amount = excluded.amount,
  currency_code = excluded.currency_code,
  provider = excluded.provider,
  is_active = excluded.is_active,
  metadata = excluded.metadata,
  updated_at = now();
