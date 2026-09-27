-- Customer quote/pickup requests and staff-published transit windows.
-- Does not seed lanes, prices, or shipments.

create table customer_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('quote', 'booking')),
  status text not null default 'pending' check (status in ('pending', 'in_review', 'booked', 'closed', 'declined')),
  service_type text not null,
  shipment_type text not null,
  speed text not null check (speed in ('standard', 'express', 'freight')),
  pickup_address text not null default '',
  pickup_city text not null,
  pickup_country text not null,
  destination_address text not null default '',
  destination_city text not null,
  destination_country text not null,
  package_count integer not null default 1 check (package_count > 0 and package_count <= 10000),
  weight numeric(12, 3),
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  dimensions text not null default '',
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null default '',
  company text not null default '',
  recipient_name text not null default '',
  recipient_phone text not null default '',
  instructions text not null default '',
  estimate_note text not null default '',
  staff_note text not null default '',
  shipment_id uuid references shipments(id) on delete set null,
  reviewed_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (weight is null or weight >= 0)
);

create trigger customer_requests_updated_at
before update on customer_requests
for each row execute function set_updated_at();

create index customer_requests_status_idx on customer_requests (status, created_at desc);
create index customer_requests_shipment_idx on customer_requests (shipment_id);

create table service_lanes (
  id uuid primary key default gen_random_uuid(),
  service_type text not null,
  origin_country text not null,
  destination_country text not null,
  speed text not null check (speed in ('standard', 'express', 'freight')),
  transit_min_days integer not null check (transit_min_days >= 1 and transit_min_days <= 180),
  transit_max_days integer not null check (transit_max_days >= transit_min_days and transit_max_days <= 180),
  note text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger service_lanes_updated_at
before update on service_lanes
for each row execute function set_updated_at();

create unique index service_lanes_route_unique
  on service_lanes (service_type, lower(origin_country), lower(destination_country), speed);

create index service_lanes_active_idx on service_lanes (is_active);

alter table customer_requests enable row level security;
alter table service_lanes enable row level security;

revoke all on table customer_requests from anon, authenticated;
revoke all on table service_lanes from anon, authenticated;
