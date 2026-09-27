import { hashPassword } from "@/lib/auth";
import { demoSeedAllowed } from "@/lib/auth";
import { query } from "@/lib/db";

const DEMO_TRACKING = "NKD-20260924-4034";

export async function seedDemo() {
  if (!demoSeedAllowed()) return;
  const users = await query<{ count: number }>("select count(*)::int as count from admin_users");
  if ((users[0]?.count ?? 0) === 0) {
    const password = process.env.DEMO_ADMIN_PASSWORD;
    if (password) {
      const passwordHash = await hashPassword(password);
      await query(
        `insert into admin_users (email, name, role, auth_provider, password_hash)
         values ('demo.ops@nkdon.test', 'Demo Operations', 'super_admin', 'local', $1)`,
        [passwordHash],
      );
      console.log("[nkdon] demo administrator created for this non-production preview");
    }
  }

  const existing = await query("select id from shipments where tracking_number = $1", [DEMO_TRACKING]);
  if (existing[0]) return;

  const facilities = await query<{ id: string }>(
    `insert into facilities (
      name, facility_code, type, address, city, state, country, operating_hours, is_active, is_demo
    ) values (
      'DEMO — Sample Sorting Desk',
      'DEMO-SORT-01',
      'Sorting Center',
      'TEST / DEMO DATA. Not a real NKDON facility.',
      'Sample City',
      '',
      'Demo',
      'Demonstration hours only',
      true,
      true
    )
    on conflict (facility_code) do update set name = excluded.name
    returning id`,
  );
  const facilityId = facilities[0]?.id;
  const actor = await query<{ id: string }>("select id from admin_users order by created_at asc limit 1");
  await query(
    `insert into shipments (
      tracking_number, reference_number, status, service_type, shipment_type,
      sender_name, sender_company, sender_city, sender_country,
      recipient_name, recipient_company, recipient_city, recipient_country,
      current_facility_id, origin_facility_id, package_count, weight, weight_unit,
      public_description, description, internal_notes, estimated_delivery_date,
      is_demo, created_by
    ) values (
      $1, 'DEMO-REF-4034', 'in_transit', 'express_courier', 'parcel',
      'Demo Sender', 'Demo Shipper Co.', 'Sample Origin', 'Demo',
      'Demo Recipient', 'Demo Receiver Co.', 'Sample Destination', 'Demo',
      $2, $2, 1, 2.400, 'kg',
      'TEST / DEMO. This is not a customer shipment.',
      'TEST / DEMO DATA. Created so the tracking screen can be reviewed. Not a real consignment.',
      'Internal demonstration note. Do not treat this as a customer record.',
      '2026-10-02',
      true,
      $3
    )`,
    [DEMO_TRACKING, facilityId ?? null, actor[0]?.id ?? null],
  );
  const shipment = await query<{ id: string }>("select id from shipments where tracking_number = $1", [DEMO_TRACKING]);
  const id = shipment[0]?.id;
  if (!id) return;
  const events = [
    ["pickup_scheduled", "Pickup Scheduled", "TEST / DEMO. Pickup was recorded for this sample shipment.", "Sample Origin, Demo", "2026-09-24T08:00:00.000Z"],
    ["picked_up", "Picked Up", "TEST / DEMO. Sample handover recorded. This is not proof of a real collection.", "Sample Origin, Demo", "2026-09-24T10:30:00.000Z"],
    ["processing", "Processing", "TEST / DEMO. Sample processing event.", "Sample City, Demo", "2026-09-24T16:00:00.000Z"],
    ["in_transit", "In Transit", "TEST / DEMO. Sample movement event. No live network position is claimed.", "Sample City, Demo", "2026-09-25T09:15:00.000Z"],
  ];
  for (const [status, title, description, location, eventTime] of events) {
    await query(
      `insert into shipment_events (shipment_id, status, title, description, location, facility_id, event_time, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, status, title, description, location, facilityId ?? null, eventTime, actor[0]?.id ?? null],
    );
  }
}
