-- The Supabase CLI's local Postgres image sets a tight default statement_timeout for the anon/
-- authenticated roles (3s / 8s). On a resource-constrained local Docker Desktop host that's
-- comfortably enough time under normal load, but discovered by actually running the storefront:
-- the shop page's product query (a five-way nested embed: variants, prices, images, catalogs,
-- inventory) intermittently got killed mid-flight whenever other containers (Kong, Turbopack
-- compiling) were competing for CPU, producing random 500s that made "Add to cart" look broken
-- even though the query itself is fine and fast once contention clears.
--
-- Use the same 15s ceiling in hosted environments. The storefront runs this nested catalog query
-- through the anon/authenticated roles as well, and Supabase's shorter role defaults can terminate
-- an otherwise valid request under cold-start or resource contention. This remains a bounded
-- timeout; service-role requests retain the project's separate default.
alter role anon set statement_timeout = '15s';
alter role authenticated set statement_timeout = '15s';
