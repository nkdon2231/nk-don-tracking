-- Couriers are staff-managed records. Nothing here is implied to be a real person
-- until someone creates it. Recorded coordinates are optional and are not live GPS.

create table couriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  courier_code text not null unique,
  vehicle text not null default '',
  phone text not null default '',
  notes text not null default '',
  photo_path text,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (courier_code ~ '^[A-Z0-9-]{2,40}$')
);

create trigger couriers_updated_at
before update on couriers
for each row execute function set_updated_at();

alter table shipments
  add column courier_id uuid references couriers(id) on delete set null;

create index shipments_courier_idx on shipments (courier_id);

alter table shipment_events
  add column latitude numeric(9, 6),
  add column longitude numeric(9, 6),
  add column coordinate_source text;

alter table shipment_events
  add constraint shipment_events_coordinates_chk check (
    (
      latitude is null
      and longitude is null
      and coordinate_source is null
    )
    or (
      latitude is not null
      and longitude is not null
      and latitude >= -90
      and latitude <= 90
      and longitude >= -180
      and longitude <= 180
      and coordinate_source in ('entered', 'facility')
    )
  );

alter table couriers enable row level security;
revoke all on table couriers from anon, authenticated;
