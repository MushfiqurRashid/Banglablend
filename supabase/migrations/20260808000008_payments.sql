-- Payments: collection/session/payment state machine (COD + SSLCOMMERZ today, bKash/Nagad/wallet
-- can be added by extending the payment_provider_code domain, no schema change needed) plus the
-- append-only payment_audits ledger that replaces the `payment_audit` Medusa module. The IPN
-- webhook handler is the only writer of payment_audits; docs/superadmin.md explicitly forbids
-- generic edit/delete on payment callback evidence, so update/delete are revoked below.

create table payment_collections (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references carts (id) on delete set null,
  order_id uuid references orders (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency_code text not null,
  status text not null default 'not_paid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payment_collections_set_updated_at
  before update on payment_collections
  for each row execute function set_updated_at();

create table payment_sessions (
  id uuid primary key default gen_random_uuid(),
  payment_collection_id uuid not null references payment_collections (id) on delete cascade,
  provider payment_provider_code not null,
  status text not null default 'pending',
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_sessions_collection_id_idx on payment_sessions (payment_collection_id);

create trigger payment_sessions_set_updated_at
  before update on payment_sessions
  for each row execute function set_updated_at();

create table payments (
  id uuid primary key default gen_random_uuid(),
  payment_session_id uuid not null references payment_sessions (id) on delete restrict,
  provider payment_provider_code not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency_code text not null,
  captured_amount numeric(12, 2) not null default 0,
  refunded_amount numeric(12, 2) not null default 0,
  status text not null default 'pending',
  transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_session_id_idx on payments (payment_session_id);

create trigger payments_set_updated_at
  before update on payments
  for each row execute function set_updated_at();

-- Append-only reconciliation ledger. Written once per gateway callback event; never edited.
create table payment_audits (
  id uuid primary key default gen_random_uuid(),
  provider payment_provider_code not null,
  transaction_id text not null,
  order_reference text,
  event_type text not null,
  status text not null,
  amount numeric(12, 2),
  currency text,
  idempotency_key text not null unique,
  payload_hash text not null,
  safe_payload jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index payment_audits_order_reference_idx on payment_audits (order_reference);
create index payment_audits_transaction_id_idx on payment_audits (transaction_id);

revoke update, delete on payment_audits from public, authenticated, anon;

create or replace function forbid_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is append-only; % is not permitted', tg_table_name, tg_op;
end;
$$;

create trigger payment_audits_forbid_update
  before update on payment_audits
  for each row execute function forbid_mutation();

create trigger payment_audits_forbid_delete
  before delete on payment_audits
  for each row execute function forbid_mutation();
