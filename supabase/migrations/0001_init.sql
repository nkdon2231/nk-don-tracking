-- NKDON Global Logistics
-- Production schema for Supabase PostgreSQL.
-- gen_random_uuid() is built into PostgreSQL 13+ (Supabase included).
-- Safe to re-run only through the migration runner, which applies each file once.

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null check (role in ('super_admin', 'admin', 'operations', 'support', 'viewer')),
  auth_provider text not null default 'local' check (auth_provider in ('local', 'supabase')),
  password_hash text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (auth_provider = 'supabase' or password_hash is not null)
);

create trigger admin_users_updated_at
before update on admin_users
for each row execute function set_updated_at();

create table admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references admin_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ip text,
  user_agent text,
  revoked_at timestamptz
);

create index admin_sessions_user_idx on admin_sessions (user_id);
create index admin_sessions_expires_idx on admin_sessions (expires_at);

create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip text,
  success boolean not null,
  created_at timestamptz not null default now()
);

create index login_attempts_email_idx on login_attempts (email, created_at desc);
create index login_attempts_ip_idx on login_attempts (ip, created_at desc);

create table facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  facility_code text not null unique,
  type text not null check (type in (
    'Headquarters',
    'Warehouse',
    'Sorting Center',
    'Airport',
    'Distribution Center',
    'Delivery Hub',
    'Customs Facility'
  )),
  address text not null default '',
  city text not null default '',
  state text not null default '',
  country text not null default '',
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  phone text not null default '',
  email text not null default '',
  operating_hours text not null default '',
  is_active boolean not null default true,
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger facilities_updated_at
before update on facilities
for each row execute function set_updated_at();

create index facilities_active_idx on facilities (is_active);
create index facilities_country_idx on facilities (country);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_number text not null unique,
  reference_number text,
  status text not null check (status in (
    'pickup_scheduled',
    'picked_up',
    'processing',
    'in_transit',
    'arrived_at_facility',
    'customs_clearance',
    'out_for_delivery',
    'delivered',
    'exception',
    'cancelled'
  )),
  service_type text not null,
  shipment_type text not null,
  sender_name text not null,
  sender_company text not null default '',
  sender_phone text not null default '',
  sender_email text not null default '',
  sender_address text not null default '',
  sender_city text not null default '',
  sender_state text not null default '',
  sender_country text not null default '',
  recipient_name text not null,
  recipient_company text not null default '',
  recipient_phone text not null default '',
  recipient_email text not null default '',
  recipient_address text not null default '',
  recipient_city text not null default '',
  recipient_state text not null default '',
  recipient_country text not null default '',
  origin_facility_id uuid references facilities(id) on delete restrict,
  destination_facility_id uuid references facilities(id) on delete restrict,
  current_facility_id uuid references facilities(id) on delete restrict,
  package_count integer not null default 1 check (package_count > 0 and package_count <= 10000),
  weight numeric(12, 3),
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  dimensions text not null default '',
  declared_value numeric(14, 2),
  currency text not null default 'USD',
  description text not null default '',
  public_description text not null default '',
  internal_notes text not null default '',
  estimated_delivery_date date,
  actual_delivery_date date,
  special_instructions text not null default '',
  is_demo boolean not null default false,
  archived_at timestamptz,
  created_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tracking_number ~ '^NKD-[0-9]{8}-[0-9]{4}$'),
  check (weight is null or weight >= 0),
  check (declared_value is null or declared_value >= 0)
);

create unique index shipments_reference_unique
  on shipments (reference_number)
  where reference_number is not null and reference_number <> '';

create trigger shipments_updated_at
before update on shipments
for each row execute function set_updated_at();

create index shipments_status_idx on shipments (status);
create index shipments_created_at_idx on shipments (created_at desc);
create index shipments_sender_name_idx on shipments (sender_name);
create index shipments_recipient_name_idx on shipments (recipient_name);
create index shipments_demo_idx on shipments (is_demo);
create index shipments_archived_idx on shipments (archived_at);

create table shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete restrict,
  status text not null check (status in (
    'pickup_scheduled',
    'picked_up',
    'processing',
    'in_transit',
    'arrived_at_facility',
    'customs_clearance',
    'out_for_delivery',
    'delivered',
    'exception',
    'cancelled'
  )),
  title text not null,
  description text not null default '',
  location text not null default '',
  facility_id uuid references facilities(id) on delete set null,
  event_time timestamptz not null,
  created_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index shipment_events_shipment_idx on shipment_events (shipment_id, event_time asc, created_at asc);
create index shipment_events_time_idx on shipment_events (event_time desc);

create or replace function prevent_event_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and current_setting('nkdon.purge', true) = 'on' then
    return old;
  end if;
  raise exception 'shipment events are immutable';
end;
$$;

create trigger shipment_events_no_update
before update on shipment_events
for each row execute function prevent_event_mutation();

create trigger shipment_events_no_delete
before delete on shipment_events
for each row execute function prevent_event_mutation();

create table shipment_evidence (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete restrict,
  event_id uuid references shipment_events(id) on delete restrict,
  public_token text not null unique,
  evidence_type text not null check (evidence_type in (
    'Package',
    'Pickup/Handover',
    'Transportation',
    'Air Cargo',
    'Facility',
    'Customs',
    'Documents',
    'Delivery',
    'Exception'
  )),
  title text not null,
  description text not null default '',
  file_path text not null,
  file_url text,
  thumbnail_path text,
  file_type text not null,
  file_size integer not null check (file_size > 0),
  location text not null default '',
  facility_id uuid references facilities(id) on delete set null,
  captured_at timestamptz,
  uploaded_by uuid references admin_users(id) on delete set null,
  is_public boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger shipment_evidence_updated_at
before update on shipment_evidence
for each row execute function set_updated_at();

create index shipment_evidence_shipment_idx on shipment_evidence (shipment_id);
create index shipment_evidence_event_idx on shipment_evidence (event_id);
create index shipment_evidence_type_idx on shipment_evidence (evidence_type);
create index shipment_evidence_public_idx on shipment_evidence (is_public);
create index shipment_evidence_created_idx on shipment_evidence (created_at desc);

create table admin_activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references admin_users(id) on delete set null,
  actor_email text,
  action text not null,
  resource text not null,
  resource_id text,
  ip text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_activity_created_idx on admin_activity (created_at desc);
create index admin_activity_resource_idx on admin_activity (resource, resource_id);
create index admin_activity_actor_idx on admin_activity (actor_id, created_at desc);

create table company_settings (
  id integer primary key default 1 check (id = 1),
  company_name text not null,
  tagline text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  website text not null default '',
  operating_hours text not null default '',
  default_weight_unit text not null default 'kg' check (default_weight_unit in ('kg', 'lb')),
  default_currency text not null default 'USD',
  updated_at timestamptz not null default now()
);

create trigger company_settings_updated_at
before update on company_settings
for each row execute function set_updated_at();

insert into company_settings (id, company_name, tagline)
values (
  1,
  'NKDON Global Logistics',
  'Moving what matters. Across borders. With confidence.'
);

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  topic text not null default '',
  message text not null,
  notification_status text not null default 'not_configured',
  created_at timestamptz not null default now()
);

create index inquiries_created_idx on inquiries (created_at desc);

create table rate_limits (
  bucket_key text primary key,
  hits integer not null,
  window_start timestamptz not null
);

create table tracking_counters (
  day date primary key,
  last_value integer not null
);
