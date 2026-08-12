-- The source Medusa database never had shipping_options as a distinct table (Medusa's
-- shipping profiles/fulfillment providers don't map 1:1 onto this schema's flat model), so
-- 001_migrated_dev_data.sql carried over regions/products/orders but nothing here -- discovered
-- by actually running checkout end-to-end: with zero shipping_options rows, every checkout
-- failed with "No shipping method is configured for this address", regardless of the address
-- entered.
--
-- Only the Bangladesh region gets an option: it's the sole region with is_active = true in the
-- migrated data (UK/US are marked isPlaceholder/inactive in 001_migrated_dev_data.sql -- those
-- markets were never actually launched in the source system, so inventing international shipping
-- rates for them here would be fabricating business data, not migrating it).
--
-- The BDT 80.00 flat rate is not invented -- it's the exact shipping_total on all 4 real
-- historical orders in 002_migrated_customers_and_orders.sql, i.e. the rate the business was
-- actually charging.
begin;

insert into shipping_options (id, region_id, name, amount, currency_code, provider, is_active) values
  (md5('shipping_option:bd-standard-delivery')::uuid,
   md5('region:reg_01KYMKFRFF0C3TFP0SGAE93DV9')::uuid,
   'Standard delivery', 80.00, 'bdt', 'manual', true);

commit;
