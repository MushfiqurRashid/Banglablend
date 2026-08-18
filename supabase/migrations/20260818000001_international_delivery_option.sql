-- International orders are accepted without a delivery charge at checkout. Operations contacts
-- the customer after order confirmation to arrange delivery and any follow-up requirements.
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
  'bf85aa9d-5f9f-4e11-b8ac-15e5715a85c0',
  id,
  'International',
  0,
  'bdt',
  'manual',
  true,
  jsonb_build_object(
    'delivery_area', 'international',
    'contact_required', true,
    'delivery_charge_added_at_checkout', false
  )
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
