-- Extra evidence categories. Existing files keep their current type.

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  where con.conrelid = 'shipment_evidence'::regclass
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%evidence_type%';
  if constraint_name is not null then
    execute format('alter table shipment_evidence drop constraint %I', constraint_name);
  end if;
end $$;

alter table shipment_evidence
  add constraint shipment_evidence_evidence_type_check
  check (evidence_type in (
    'Package',
    'Package Condition',
    'Pickup/Handover',
    'Transportation',
    'Air Cargo',
    'Vehicle',
    'Facility',
    'Courier',
    'Customs',
    'Clearance',
    'Documents',
    'Waybill',
    'Delivery',
    'Signature',
    'Exception'
  ));
