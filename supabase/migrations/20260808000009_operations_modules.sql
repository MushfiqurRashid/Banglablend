-- Remaining operational modules: admin_audit_log (append-only, replaces the `admin-control`
-- module's AdminAuditLog), app_settings (typed key/value config store), and inquiries (contact /
-- newsletter / wholesale / corporate lead capture).

create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references staff_members (id) on delete set null,
  actor_email text,
  action text not null,
  resource_type text not null,
  resource_id text,
  resource_label text,
  summary text not null,
  before jsonb,
  after jsonb,
  request_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_resource_type_idx on admin_audit_log (resource_type);
create index admin_audit_log_action_idx on admin_audit_log (action);
create index admin_audit_log_actor_id_idx on admin_audit_log (actor_id);

revoke update, delete on admin_audit_log from public, authenticated, anon;

create trigger admin_audit_log_forbid_update
  before update on admin_audit_log
  for each row execute function forbid_mutation();

create trigger admin_audit_log_forbid_delete
  before delete on admin_audit_log
  for each row execute function forbid_mutation();

create table app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  "group" text not null default 'general',
  label text not null,
  description text,
  value jsonb not null,
  value_type app_setting_value_type not null default 'string',
  is_public boolean not null default false,
  is_secret boolean not null default false,
  sort_order int not null default 0,
  updated_by uuid references staff_members (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index app_settings_group_idx on app_settings ("group");

create trigger app_settings_set_updated_at
  before update on app_settings
  for each row execute function set_updated_at();

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  type inquiry_type not null,
  status inquiry_status not null default 'new',
  company text,
  contact_person text,
  email citext not null,
  telephone text,
  quantity int,
  budget text,
  occasion text,
  delivery_date date,
  delivery_locations text,
  packaging text,
  message_card text,
  notes text,
  assigned_staff_id uuid references staff_members (id) on delete set null,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inquiries_status_idx on inquiries (status);
create index inquiries_type_idx on inquiries (type);

create trigger inquiries_set_updated_at
  before update on inquiries
  for each row execute function set_updated_at();
