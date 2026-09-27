-- Copy shipments that already existed before this schema.
-- Previous tables are renamed to legacy_* first. This does not delete them.
-- Rows that do not match the current tracking-number rule stay only in legacy_*.

do $$
begin
  if to_regclass('public.legacy_shipments') is null then
    return;
  end if;

  insert into shipments (
    id, tracking_number, reference_number, status, service_type, shipment_type,
    sender_name, sender_phone, sender_address, sender_city,
    recipient_name, recipient_phone, recipient_address, recipient_city,
    package_count, weight, weight_unit, dimensions, declared_value, currency,
    description, public_description, internal_notes, special_instructions,
    estimated_delivery_date, actual_delivery_date, is_demo, created_at, updated_at
  )
  select
    l.id,
    l.tracking_number,
    nullif(trim(l.reference_number), ''),
    case lower(trim(l.status))
      when 'pickup' then 'pickup_scheduled'
      when 'pickup_scheduled' then 'pickup_scheduled'
      when 'picked_up' then 'picked_up'
      when 'processing' then 'processing'
      when 'in_transit' then 'in_transit'
      when 'arrived_at_facility' then 'arrived_at_facility'
      when 'customs_clearance' then 'customs_clearance'
      when 'out_for_delivery' then 'out_for_delivery'
      when 'delivered' then 'delivered'
      when 'exception' then 'exception'
      when 'cancelled' then 'cancelled'
      else null
    end,
    coalesce(nullif(trim(l.shipping_method), ''), 'unspecified'),
    coalesce(nullif(trim(l.shipment_type), ''), 'parcel'),
    trim(l.sender_name),
    coalesce(l.sender_phone, ''),
    coalesce(l.origin, ''),
    '',
    trim(l.recipient_name),
    coalesce(l.recipient_phone, ''),
    coalesce(l.destination, ''),
    '',
    least(10000, greatest(coalesce(l.quantity, 1), 1)),
    case
      when substring(coalesce(l.package_weight, '') from '([0-9]+(\.[0-9]+)?)') is null then null
      else substring(l.package_weight from '([0-9]+(\.[0-9]+)?)')::numeric
    end,
    case when coalesce(l.package_weight, '') ~* 'lb' then 'lb' else 'kg' end,
    coalesce(l.package_dimensions, ''),
    case when l.declared_value is not null and l.declared_value >= 0 then l.declared_value else null end,
    coalesce(nullif(trim(l.currency), ''), 'USD'),
    coalesce(l.package_description, ''),
    '',
    concat_ws(
      E'\n',
      nullif(trim(coalesce(l.internal_notes, '')), ''),
      case when nullif(trim(coalesce(l.status, '')), '') is not null then 'Previous status: ' || trim(l.status) else null end,
      case when nullif(trim(coalesce(l.insurance_status, '')), '') is not null then 'Insurance status: ' || trim(l.insurance_status) else null end,
      case when l.insurance_value is not null then 'Insurance value: ' || l.insurance_value::text else null end,
      case when nullif(trim(coalesce(l.delivery_contact, '')), '') is not null then 'Delivery contact: ' || trim(l.delivery_contact) else null end,
      case when nullif(trim(coalesce(l.current_location, '')), '') is not null then 'Previous location note: ' || trim(l.current_location) else null end,
      case when nullif(trim(coalesce(l.last_event_description, '')), '') is not null then 'Previous event note: ' || trim(l.last_event_description) else null end
    ),
    coalesce(l.delivery_instructions, ''),
    l.estimated_delivery,
    l.actual_delivery_date::date,
    false,
    coalesce(l.created_at, now()),
    coalesce(l.updated_at, l.created_at, now())
  from legacy_shipments l
  where nullif(trim(l.sender_name), '') is not null
    and nullif(trim(l.recipient_name), '') is not null
    and l.tracking_number ~ '^NKD-[0-9]{8}-[0-9]{4}$'
    and case lower(trim(l.status))
      when 'pickup' then 'pickup_scheduled'
      when 'pickup_scheduled' then 'pickup_scheduled'
      when 'picked_up' then 'picked_up'
      when 'processing' then 'processing'
      when 'in_transit' then 'in_transit'
      when 'arrived_at_facility' then 'arrived_at_facility'
      when 'customs_clearance' then 'customs_clearance'
      when 'out_for_delivery' then 'out_for_delivery'
      when 'delivered' then 'delivered'
      when 'exception' then 'exception'
      when 'cancelled' then 'cancelled'
      else null
    end is not null
    and not exists (
      select 1 from shipments s
      where s.id = l.id or s.tracking_number = l.tracking_number
    );

  insert into shipment_events (
    id, shipment_id, status, title, description, location, event_time, created_at
  )
  select
    e.id,
    e.shipment_id,
    case lower(trim(e.status))
      when 'pickup' then 'pickup_scheduled'
      when 'pickup_scheduled' then 'pickup_scheduled'
      when 'picked_up' then 'picked_up'
      when 'processing' then 'processing'
      when 'in_transit' then 'in_transit'
      when 'arrived_at_facility' then 'arrived_at_facility'
      when 'customs_clearance' then 'customs_clearance'
      when 'out_for_delivery' then 'out_for_delivery'
      when 'delivered' then 'delivered'
      when 'exception' then 'exception'
      when 'cancelled' then 'cancelled'
      else null
    end,
    left(coalesce(nullif(trim(e.event_code), ''), nullif(trim(e.status), ''), 'Recorded update'), 160),
    coalesce(e.description, ''),
    concat_ws(' · ', nullif(trim(e.location), ''), nullif(trim(e.facility), '')),
    e.event_time,
    e.event_time
  from legacy_shipment_events e
  where e.event_time is not null
    and exists (select 1 from shipments s where s.id = e.shipment_id)
    and case lower(trim(e.status))
      when 'pickup' then 'pickup_scheduled'
      when 'pickup_scheduled' then 'pickup_scheduled'
      when 'picked_up' then 'picked_up'
      when 'processing' then 'processing'
      when 'in_transit' then 'in_transit'
      when 'arrived_at_facility' then 'arrived_at_facility'
      when 'customs_clearance' then 'customs_clearance'
      when 'out_for_delivery' then 'out_for_delivery'
      when 'delivered' then 'delivered'
      when 'exception' then 'exception'
      when 'cancelled' then 'cancelled'
      else null
    end is not null
    and not exists (select 1 from shipment_events n where n.id = e.id);
end $$;
