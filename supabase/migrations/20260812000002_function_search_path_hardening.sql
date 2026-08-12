-- Fix each helper's object-resolution path so callers cannot influence which relation or
-- function name is resolved at execution time. SECURITY DEFINER helpers already declare this;
-- these trigger/formatting helpers should follow the same rule.

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.enforce_product_gift_type() set search_path = public, pg_temp;
alter function public.format_business_order_reference(bigint) set search_path = public, pg_temp;
alter function public.forbid_mutation() set search_path = public, pg_temp;
