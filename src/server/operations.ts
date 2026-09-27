import { randomInt, randomUUID } from "node:crypto";
import {
  HAPPY_PATH,
  STATUS_LABEL,
  type Role,
  type ShipmentStatus,
  serviceLabel,
  shipmentTypeLabel,
} from "@/lib/constants";
import { query, withTransaction, type QueryFn } from "@/lib/db";
import { HttpError } from "@/lib/http";
import type { StaffUser } from "@/lib/auth";

type Row = Record<string, unknown>;

function asString(value: unknown) {
  if (value == null) return "";
  return String(value);
}

function asNumber(value: unknown) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asBool(value: unknown) {
  return value === true || value === "t" || value === "true";
}

function iso(value: unknown) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toISOString();
}

function dateOnly(value: unknown) {
  if (value == null || value === "") return null;
  return String(value).slice(0, 10);
}

export function escapeLike(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

async function allocateTrackingNumber(q: QueryFn) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const tracking = `NKD-${stamp}-${String(randomInt(0, 10000)).padStart(4, "0")}`;
    const existing = await q("select 1 from shipments where tracking_number = $1", [tracking]);
    if (existing.rows.length === 0) return tracking;
  }
  throw new HttpError(409, "tracking_collision", "Could not allocate a tracking number. Try again.");
}

function facilityBrief(row: Row | undefined) {
  if (!row) return null;
  return {
    id: asString(row.id),
    name: asString(row.name),
    code: asString(row.facility_code),
    type: asString(row.type),
    city: asString(row.city),
    country: asString(row.country),
    isDemo: asBool(row.is_demo),
  };
}

export function mapFacility(row: Row) {
  return {
    id: asString(row.id),
    name: asString(row.name),
    facilityCode: asString(row.facility_code),
    type: asString(row.type),
    address: asString(row.address),
    city: asString(row.city),
    state: asString(row.state),
    country: asString(row.country),
    latitude: asNumber(row.latitude),
    longitude: asNumber(row.longitude),
    phone: asString(row.phone),
    email: asString(row.email),
    operatingHours: asString(row.operating_hours),
    isActive: asBool(row.is_active),
    isDemo: asBool(row.is_demo),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapShipment(row: Row) {
  return {
    id: asString(row.id),
    trackingNumber: asString(row.tracking_number),
    referenceNumber: asString(row.reference_number),
    status: asString(row.status) as ShipmentStatus,
    statusLabel: STATUS_LABEL[asString(row.status) as ShipmentStatus] ?? asString(row.status),
    serviceType: asString(row.service_type),
    serviceLabel: serviceLabel(asString(row.service_type)),
    shipmentType: asString(row.shipment_type),
    shipmentTypeLabel: shipmentTypeLabel(asString(row.shipment_type)),
    senderName: asString(row.sender_name),
    senderCompany: asString(row.sender_company),
    senderPhone: asString(row.sender_phone),
    senderEmail: asString(row.sender_email),
    senderAddress: asString(row.sender_address),
    senderCity: asString(row.sender_city),
    senderState: asString(row.sender_state),
    senderCountry: asString(row.sender_country),
    recipientName: asString(row.recipient_name),
    recipientCompany: asString(row.recipient_company),
    recipientPhone: asString(row.recipient_phone),
    recipientEmail: asString(row.recipient_email),
    recipientAddress: asString(row.recipient_address),
    recipientCity: asString(row.recipient_city),
    recipientState: asString(row.recipient_state),
    recipientCountry: asString(row.recipient_country),
    originFacilityId: row.origin_facility_id ? asString(row.origin_facility_id) : null,
    destinationFacilityId: row.destination_facility_id ? asString(row.destination_facility_id) : null,
    currentFacilityId: row.current_facility_id ? asString(row.current_facility_id) : null,
    packageCount: Number(row.package_count ?? 1),
    weight: asNumber(row.weight),
    weightUnit: asString(row.weight_unit || "kg"),
    dimensions: asString(row.dimensions),
    declaredValue: asNumber(row.declared_value),
    currency: asString(row.currency || "USD"),
    description: asString(row.description),
    publicDescription: asString(row.public_description),
    internalNotes: asString(row.internal_notes),
    estimatedDeliveryDate: dateOnly(row.estimated_delivery_date),
    actualDeliveryDate: dateOnly(row.actual_delivery_date),
    specialInstructions: asString(row.special_instructions),
    isDemo: asBool(row.is_demo),
    archivedAt: iso(row.archived_at),
    createdBy: row.created_by ? asString(row.created_by) : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapEvent(row: Row) {
  return {
    id: asString(row.id),
    shipmentId: asString(row.shipment_id),
    status: asString(row.status) as ShipmentStatus,
    statusLabel: STATUS_LABEL[asString(row.status) as ShipmentStatus] ?? asString(row.status),
    title: asString(row.title),
    description: asString(row.description),
    location: asString(row.location),
    facilityId: row.facility_id ? asString(row.facility_id) : null,
    facilityName: asString(row.facility_name),
    facilityCity: asString(row.facility_city),
    facilityCountry: asString(row.facility_country),
    facilityIsDemo: asBool(row.facility_is_demo),
    eventTime: iso(row.event_time),
    createdBy: row.created_by ? asString(row.created_by) : null,
    createdByName: asString(row.created_by_name),
    createdAt: iso(row.created_at),
  };
}

export function mapEvidence(row: Row) {
  return {
    id: asString(row.id),
    shipmentId: asString(row.shipment_id),
    eventId: row.event_id ? asString(row.event_id) : null,
    publicToken: asString(row.public_token),
    evidenceType: asString(row.evidence_type),
    title: asString(row.title),
    description: asString(row.description),
    filePath: asString(row.file_path),
    fileType: asString(row.file_type),
    fileSize: Number(row.file_size ?? 0),
    location: asString(row.location),
    facilityId: row.facility_id ? asString(row.facility_id) : null,
    facilityName: asString(row.facility_name),
    capturedAt: iso(row.captured_at),
    uploadedBy: row.uploaded_by ? asString(row.uploaded_by) : null,
    uploadedByName: asString(row.uploaded_by_name),
    isPublic: asBool(row.is_public),
    isDemo: asBool(row.is_demo),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    trackingNumber: asString(row.tracking_number),
  };
}

const EVENT_SELECT = `
  select e.*, f.name as facility_name, f.city as facility_city, f.country as facility_country, f.is_demo as facility_is_demo,
         u.name as created_by_name
  from shipment_events e
  left join facilities f on f.id = e.facility_id
  left join admin_users u on u.id = e.created_by
`;

const EVIDENCE_SELECT = `
  select ev.*, f.name as facility_name, u.name as uploaded_by_name, s.tracking_number
  from shipment_evidence ev
  join shipments s on s.id = ev.shipment_id
  left join facilities f on f.id = ev.facility_id
  left join admin_users u on u.id = ev.uploaded_by
`;

export async function getSettings() {
  const rows = await query("select * from company_settings where id = 1");
  const row = rows[0];
  if (!row) {
    return {
      companyName: "NKDON Global Logistics",
      tagline: "Moving what matters. Across borders. With confidence.",
      phone: "",
      email: "",
      address: "",
      website: "",
      operatingHours: "",
      defaultWeightUnit: "kg",
      defaultCurrency: "USD",
    };
  }
  return {
    companyName: asString(row.company_name),
    tagline: asString(row.tagline),
    phone: asString(row.phone),
    email: asString(row.email),
    address: asString(row.address),
    website: asString(row.website),
    operatingHours: asString(row.operating_hours),
    defaultWeightUnit: asString(row.default_weight_unit || "kg"),
    defaultCurrency: asString(row.default_currency || "USD"),
  };
}

export async function updateSettings(input: {
  companyName: string;
  tagline: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  operatingHours?: string;
  defaultWeightUnit: string;
  defaultCurrency: string;
}) {
  await query(
    `update company_settings set
      company_name = $1, tagline = $2, phone = $3, email = $4, address = $5,
      website = $6, operating_hours = $7, default_weight_unit = $8, default_currency = $9
     where id = 1`,
    [
      input.companyName,
      input.tagline,
      input.phone ?? "",
      input.email ?? "",
      input.address ?? "",
      input.website ?? "",
      input.operatingHours ?? "",
      input.defaultWeightUnit,
      input.defaultCurrency,
    ],
  );
  return getSettings();
}

export async function listFacilities() {
  const rows = await query("select * from facilities order by is_demo asc, name asc");
  return rows.map(mapFacility);
}

type FacilityInput = {
  name: string;
  facilityCode: string;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  email?: string;
  operatingHours?: string;
  isActive?: boolean;
  isDemo?: boolean;
};

export async function createFacility(input: FacilityInput) {
  const rows = await query(
    `insert into facilities (
      name, facility_code, type, address, city, state, country, latitude, longitude,
      phone, email, operating_hours, is_active, is_demo
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    returning *`,
    [
      input.name,
      input.facilityCode,
      input.type,
      input.address ?? "",
      input.city ?? "",
      input.state ?? "",
      input.country ?? "",
      input.latitude ?? null,
      input.longitude ?? null,
      input.phone ?? "",
      input.email ?? "",
      input.operatingHours ?? "",
      input.isActive ?? true,
      input.isDemo ?? true,
    ],
  );
  return mapFacility(rows[0]);
}

export async function updateFacility(id: string, input: FacilityInput) {
  const rows = await query(
    `update facilities set
      name = $2, facility_code = $3, type = $4, address = $5, city = $6, state = $7, country = $8,
      latitude = $9, longitude = $10, phone = $11, email = $12, operating_hours = $13,
      is_active = $14, is_demo = $15
     where id = $1
     returning *`,
    [
      id,
      input.name,
      input.facilityCode,
      input.type,
      input.address ?? "",
      input.city ?? "",
      input.state ?? "",
      input.country ?? "",
      input.latitude ?? null,
      input.longitude ?? null,
      input.phone ?? "",
      input.email ?? "",
      input.operatingHours ?? "",
      input.isActive ?? true,
      input.isDemo ?? true,
    ],
  );
  if (!rows[0]) throw new HttpError(404, "not_found", "Facility not found.");
  return mapFacility(rows[0]);
}

type ShipmentInput = {
  referenceNumber?: string;
  status: ShipmentStatus;
  serviceType: string;
  shipmentType: string;
  senderName: string;
  senderCompany?: string;
  senderPhone?: string;
  senderEmail?: string;
  senderAddress?: string;
  senderCity?: string;
  senderState?: string;
  senderCountry?: string;
  recipientName: string;
  recipientCompany?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientAddress?: string;
  recipientCity?: string;
  recipientState?: string;
  recipientCountry?: string;
  originFacilityId?: string | null;
  destinationFacilityId?: string | null;
  currentFacilityId?: string | null;
  packageCount: number;
  weight?: number | null;
  weightUnit?: string;
  dimensions?: string;
  declaredValue?: number | null;
  currency?: string;
  description?: string;
  publicDescription?: string;
  internalNotes?: string;
  estimatedDeliveryDate?: string | null;
  actualDeliveryDate?: string | null;
  specialInstructions?: string;
  isDemo?: boolean;
};

function shipmentValues(input: ShipmentInput) {
  return [
    input.referenceNumber?.trim() || null,
    input.status,
    input.serviceType,
    input.shipmentType,
    input.senderName,
    input.senderCompany ?? "",
    input.senderPhone ?? "",
    input.senderEmail ?? "",
    input.senderAddress ?? "",
    input.senderCity ?? "",
    input.senderState ?? "",
    input.senderCountry ?? "",
    input.recipientName,
    input.recipientCompany ?? "",
    input.recipientPhone ?? "",
    input.recipientEmail ?? "",
    input.recipientAddress ?? "",
    input.recipientCity ?? "",
    input.recipientState ?? "",
    input.recipientCountry ?? "",
    input.originFacilityId || null,
    input.destinationFacilityId || null,
    input.currentFacilityId || null,
    input.packageCount,
    input.weight ?? null,
    input.weightUnit ?? "kg",
    input.dimensions ?? "",
    input.declaredValue ?? null,
    (input.currency ?? "USD").toUpperCase(),
    input.description ?? "",
    input.publicDescription ?? "",
    input.internalNotes ?? "",
    input.estimatedDeliveryDate || null,
    input.actualDeliveryDate || null,
    input.specialInstructions ?? "",
    input.isDemo ?? false,
  ];
}

export async function createShipment(actor: StaffUser, input: ShipmentInput) {
  return withTransaction(async (q) => {
    const tracking = await allocateTrackingNumber(q);
    const values = shipmentValues(input);
    let rows;
    try {
      const inserted = await q(
        `insert into shipments (
          tracking_number, reference_number, status, service_type, shipment_type,
          sender_name, sender_company, sender_phone, sender_email, sender_address, sender_city, sender_state, sender_country,
          recipient_name, recipient_company, recipient_phone, recipient_email, recipient_address, recipient_city, recipient_state, recipient_country,
          origin_facility_id, destination_facility_id, current_facility_id,
          package_count, weight, weight_unit, dimensions, declared_value, currency,
          description, public_description, internal_notes, estimated_delivery_date, actual_delivery_date,
          special_instructions, is_demo, created_by
        ) values (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,$10,$11,$12,$13,
          $14,$15,$16,$17,$18,$19,$20,$21,
          $22,$23,$24,
          $25,$26,$27,$28,$29,$30,
          $31,$32,$33,$34,$35,
          $36,$37,$38
        ) returning *`,
        [tracking, ...values, actor.id],
      );
      rows = inserted.rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/shipments_reference_unique|duplicate key/i.test(message)) {
        throw new HttpError(409, "duplicate_reference", "That reference number is already in use.");
      }
      throw error;
    }
    const shipment = rows[0];
    await q(
      `insert into shipment_events (shipment_id, status, title, description, location, facility_id, event_time, created_by)
       values ($1, $2, $3, $4, $5, $6, now(), $7)`,
      [
        shipment.id,
        input.status,
        STATUS_LABEL[input.status],
        input.isDemo ? "TEST / DEMO. Initial status recorded for this demonstration shipment." : "Shipment record created.",
        [input.senderCity, input.senderCountry].filter(Boolean).join(", "),
        input.currentFacilityId || input.originFacilityId || null,
        actor.id,
      ],
    );
    return mapShipment(shipment);
  });
}

export async function updateShipment(id: string, input: ShipmentInput) {
  try {
    const rows = await query(
      `update shipments set
        reference_number = $2, status = $3, service_type = $4, shipment_type = $5,
        sender_name = $6, sender_company = $7, sender_phone = $8, sender_email = $9,
        sender_address = $10, sender_city = $11, sender_state = $12, sender_country = $13,
        recipient_name = $14, recipient_company = $15, recipient_phone = $16, recipient_email = $17,
        recipient_address = $18, recipient_city = $19, recipient_state = $20, recipient_country = $21,
        origin_facility_id = $22, destination_facility_id = $23, current_facility_id = $24,
        package_count = $25, weight = $26, weight_unit = $27, dimensions = $28, declared_value = $29, currency = $30,
        description = $31, public_description = $32, internal_notes = $33,
        estimated_delivery_date = $34, actual_delivery_date = $35, special_instructions = $36, is_demo = $37
       where id = $1
       returning *`,
      [id, ...shipmentValues(input)],
    );
    if (!rows[0]) throw new HttpError(404, "not_found", "Shipment not found.");
    return mapShipment(rows[0]);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (/duplicate key|shipments_reference_unique/i.test(message)) {
      throw new HttpError(409, "duplicate_reference", "That reference number is already in use.");
    }
    throw error;
  }
}

export async function setArchived(id: string, archived: boolean) {
  const rows = await query(
    `update shipments set archived_at = case when $2 then now() else null end where id = $1 returning *`,
    [id, archived],
  );
  if (!rows[0]) throw new HttpError(404, "not_found", "Shipment not found.");
  return mapShipment(rows[0]);
}

export async function getShipment(id: string) {
  const rows = await query("select * from shipments where id = $1", [id]);
  if (!rows[0]) return null;
  const facilityIds = [rows[0].origin_facility_id, rows[0].destination_facility_id, rows[0].current_facility_id].filter(Boolean);
  const facilities = facilityIds.length
    ? await query("select * from facilities where id = any($1::uuid[])", [facilityIds])
    : [];
  const events = await query(`${EVENT_SELECT} where e.shipment_id = $1 order by e.event_time asc, e.created_at asc`, [id]);
  const evidence = await query(`${EVIDENCE_SELECT} where ev.shipment_id = $1 order by ev.created_at desc`, [id]);
  const byId = new Map(facilities.map((row) => [asString(row.id), row]));
  return {
    shipment: mapShipment(rows[0]),
    originFacility: facilityBrief(rows[0].origin_facility_id ? byId.get(asString(rows[0].origin_facility_id)) : undefined),
    destinationFacility: facilityBrief(rows[0].destination_facility_id ? byId.get(asString(rows[0].destination_facility_id)) : undefined),
    currentFacility: facilityBrief(rows[0].current_facility_id ? byId.get(asString(rows[0].current_facility_id)) : undefined),
    events: events.map(mapEvent),
    evidence: evidence.map(mapEvidence),
  };
}

const SORTS: Record<string, string> = {
  created_at: "s.created_at",
  updated_at: "s.updated_at",
  tracking_number: "s.tracking_number",
  status: "s.status",
};

export async function listShipments(input: {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  dir?: string;
  archived?: boolean;
}) {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replace("?", `$${params.length}`));
  };
  if (!input.archived) where.push("s.archived_at is null");
  if (input.status) add("s.status = ?", input.status);
  if (input.from) add("s.created_at::date >= ?::date", input.from);
  if (input.to) add("s.created_at::date <= ?::date", input.to);
  if (input.q?.trim()) {
    add(
      `(s.tracking_number ilike ? escape '\\' or coalesce(s.reference_number, '') ilike ? escape '\\'
        or s.sender_name ilike ? escape '\\' or s.recipient_name ilike ? escape '\\'
        or s.sender_company ilike ? escape '\\' or s.recipient_company ilike ? escape '\\')`,
      escapeLike(input.q.trim()),
    );
    const placeholder = `$${params.length}`;
    where[where.length - 1] = where[where.length - 1].replaceAll("?", placeholder);
  }
  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const sort = SORTS[input.sort ?? ""] ?? "s.created_at";
  const dir = input.dir === "asc" ? "asc" : "desc";
  const pageSize = Math.min(50, Math.max(1, input.pageSize ?? 20));
  const page = Math.max(1, input.page ?? 1);
  const countRows = await query<{ count: number }>(`select count(*)::int as count from shipments s ${clause}`, params);
  const rows = await query(
    `select s.* from shipments s ${clause} order by ${sort} ${dir} limit ${pageSize} offset ${(page - 1) * pageSize}`,
    params,
  );
  return {
    items: rows.map(mapShipment),
    page,
    pageSize,
    total: countRows[0]?.count ?? 0,
  };
}

export async function addEvent(
  actor: StaffUser,
  shipmentId: string,
  input: { status: ShipmentStatus; title: string; description?: string; location?: string; facilityId?: string | null; eventTime: string },
) {
  return withTransaction(async (q) => {
    const existing = await q("select id, is_demo from shipments where id = $1", [shipmentId]);
    if (!existing.rows[0]) throw new HttpError(404, "not_found", "Shipment not found.");
    const inserted = await q(
      `insert into shipment_events (shipment_id, status, title, description, location, facility_id, event_time, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       returning *`,
      [
        shipmentId,
        input.status,
        input.title,
        input.description ?? "",
        input.location ?? "",
        input.facilityId || null,
        new Date(input.eventTime).toISOString(),
        actor.id,
      ],
    );
    await q(
      `update shipments set
        status = $2,
        current_facility_id = coalesce($3, current_facility_id),
        actual_delivery_date = case when $2 = 'delivered' then coalesce(actual_delivery_date, $4::date) else actual_delivery_date end
       where id = $1`,
      [shipmentId, input.status, input.facilityId || null, new Date(input.eventTime).toISOString().slice(0, 10)],
    );
    return { eventId: asString(inserted.rows[0].id), isDemo: asBool(existing.rows[0].is_demo) };
  });
}

export async function publicTracking(trackingNumber: string) {
  const rows = await query("select * from shipments where tracking_number = $1", [trackingNumber]);
  const row = rows[0];
  if (!row) return null;
  const facilityRows = row.current_facility_id
    ? await query("select * from facilities where id = $1", [row.current_facility_id])
    : [];
  const events = await query(
    `${EVENT_SELECT} where e.shipment_id = $1 order by e.event_time asc, e.created_at asc`,
    [row.id],
  );
  const evidence = await query(
    `${EVIDENCE_SELECT} where ev.shipment_id = $1 and ev.is_public = true order by ev.captured_at desc nulls last, ev.created_at desc`,
    [row.id],
  );
  const occurred = new Set(events.map((event) => asString(event.status)));
  const facility = facilityRows[0];
  return {
    trackingNumber: asString(row.tracking_number),
    status: asString(row.status),
    statusLabel: STATUS_LABEL[asString(row.status) as ShipmentStatus] ?? asString(row.status),
    serviceType: serviceLabel(asString(row.service_type)),
    shipmentType: shipmentTypeLabel(asString(row.shipment_type)),
    origin: {
      city: asString(row.sender_city),
      country: asString(row.sender_country),
    },
    destination: {
      city: asString(row.recipient_city),
      country: asString(row.recipient_country),
    },
    packageCount: Number(row.package_count ?? 1),
    weight: asNumber(row.weight),
    weightUnit: asString(row.weight_unit || "kg"),
    publicDescription: asString(row.public_description),
    estimatedDeliveryDate: dateOnly(row.estimated_delivery_date),
    actualDeliveryDate: dateOnly(row.actual_delivery_date),
    isDemo: asBool(row.is_demo),
    currentFacility: facility
      ? {
          name: asString(facility.name),
          city: asString(facility.city),
          country: asString(facility.country),
          isDemo: asBool(facility.is_demo),
        }
      : null,
    progress: HAPPY_PATH.map((status) => ({
      status,
      label: STATUS_LABEL[status],
      occurred: occurred.has(status),
      current: asString(row.status) === status,
    })),
    events: events.map((event) => ({
      status: asString(event.status),
      statusLabel: STATUS_LABEL[asString(event.status) as ShipmentStatus] ?? asString(event.status),
      title: asString(event.title),
      description: asString(event.description),
      location: asString(event.location),
      eventTime: iso(event.event_time),
      facility: event.facility_name
        ? {
            name: asString(event.facility_name),
            city: asString(event.facility_city),
            country: asString(event.facility_country),
            isDemo: asBool(event.facility_is_demo),
          }
        : null,
    })),
    evidence: evidence.map((item) => ({
      token: asString(item.public_token),
      evidenceType: asString(item.evidence_type),
      title: asString(item.title),
      description: asString(item.description),
      fileType: asString(item.file_type),
      fileSize: Number(item.file_size ?? 0),
      location: asString(item.location),
      capturedAt: iso(item.captured_at),
      isDemo: asBool(item.is_demo),
    })),
  };
}

export async function listEvidence(input: { q?: string; type?: string; shipmentId?: string; visibility?: string }) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (input.shipmentId) {
    params.push(input.shipmentId);
    where.push(`ev.shipment_id = $${params.length}`);
  }
  if (input.type) {
    params.push(input.type);
    where.push(`ev.evidence_type = $${params.length}`);
  }
  if (input.visibility === "public") where.push("ev.is_public = true");
  if (input.visibility === "private") where.push("ev.is_public = false");
  if (input.q?.trim()) {
    params.push(escapeLike(input.q.trim()));
    where.push(
      `(ev.title ilike $${params.length} escape '\\' or ev.description ilike $${params.length} escape '\\' or s.tracking_number ilike $${params.length} escape '\\')`,
    );
  }
  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const rows = await query(`${EVIDENCE_SELECT} ${clause} order by ev.created_at desc limit 200`, params);
  return rows.map(mapEvidence);
}

export async function insertEvidence(input: {
  shipmentId: string;
  eventId?: string | null;
  evidenceType: string;
  title: string;
  description?: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  location?: string;
  facilityId?: string | null;
  capturedAt?: string | null;
  uploadedBy: string;
  isPublic?: boolean;
  isDemo?: boolean;
}) {
  const shipment = await query<{ is_demo: boolean }>("select is_demo from shipments where id = $1", [input.shipmentId]);
  if (!shipment[0]) throw new HttpError(404, "not_found", "Shipment not found.");
  if (input.eventId) {
    const event = await query("select id from shipment_events where id = $1 and shipment_id = $2", [input.eventId, input.shipmentId]);
    if (!event[0]) throw new HttpError(400, "invalid_event", "That event does not belong to this shipment.");
  }
  const token = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "").slice(0, 8);
  const rows = await query(
    `insert into shipment_evidence (
      shipment_id, event_id, public_token, evidence_type, title, description, file_path, file_type, file_size,
      location, facility_id, captured_at, uploaded_by, is_public, is_demo
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    returning id`,
    [
      input.shipmentId,
      input.eventId || null,
      token,
      input.evidenceType,
      input.title,
      input.description ?? "",
      input.filePath,
      input.fileType,
      input.fileSize,
      input.location ?? "",
      input.facilityId || null,
      input.capturedAt ? new Date(input.capturedAt).toISOString() : null,
      input.uploadedBy,
      input.isPublic ?? false,
      input.isDemo ?? asBool(shipment[0].is_demo),
    ],
  );
  return asString(rows[0].id);
}

export async function updateEvidence(
  id: string,
  input: {
    evidenceType: string;
    title: string;
    description?: string;
    location?: string;
    facilityId?: string | null;
    eventId?: string | null;
    capturedAt?: string | null;
    isPublic?: boolean;
    isDemo?: boolean;
  },
) {
  const current = await query<{ shipment_id: string }>("select shipment_id from shipment_evidence where id = $1", [id]);
  if (!current[0]) throw new HttpError(404, "not_found", "Evidence not found.");
  if (input.eventId) {
    const event = await query("select id from shipment_events where id = $1 and shipment_id = $2", [input.eventId, current[0].shipment_id]);
    if (!event[0]) throw new HttpError(400, "invalid_event", "That event does not belong to this shipment.");
  }
  const rows = await query(
    `update shipment_evidence set
      evidence_type = $2, title = $3, description = $4, location = $5, facility_id = $6,
      event_id = $7, captured_at = $8, is_public = $9, is_demo = $10
     where id = $1
     returning *`,
    [
      id,
      input.evidenceType,
      input.title,
      input.description ?? "",
      input.location ?? "",
      input.facilityId || null,
      input.eventId || null,
      input.capturedAt ? new Date(input.capturedAt).toISOString() : null,
      input.isPublic ?? false,
      input.isDemo ?? false,
    ],
  );
  const full = await query(`${EVIDENCE_SELECT} where ev.id = $1`, [id]);
  return mapEvidence(full[0] ?? rows[0]);
}

export async function getEvidence(id: string) {
  const rows = await query(`${EVIDENCE_SELECT} where ev.id = $1`, [id]);
  return rows[0] ? mapEvidence(rows[0]) : null;
}

export async function getPublicEvidence(token: string) {
  const rows = await query(
    `select * from shipment_evidence where public_token = $1 and is_public = true`,
    [token],
  );
  return rows[0] ? mapEvidence(rows[0]) : null;
}

export async function deleteEvidence(id: string) {
  const rows = await query<{ file_path: string }>("delete from shipment_evidence where id = $1 returning file_path", [id]);
  if (!rows[0]) throw new HttpError(404, "not_found", "Evidence not found.");
  return asString(rows[0].file_path);
}

export async function dashboardStats() {
  const rows = await query<{
    total: number;
    active: number;
    delivered: number;
    exceptions: number;
    in_transit: number;
    pickup_scheduled: number;
    evidence: number;
  }>(
    `select
      count(*)::int as total,
      count(*) filter (where archived_at is null and status not in ('delivered', 'cancelled'))::int as active,
      count(*) filter (where status = 'delivered')::int as delivered,
      count(*) filter (where status = 'exception' and archived_at is null)::int as exceptions,
      count(*) filter (where status = 'in_transit' and archived_at is null)::int as in_transit,
      count(*) filter (where status = 'pickup_scheduled' and archived_at is null)::int as pickup_scheduled,
      (select count(*)::int from shipment_evidence) as evidence
     from shipments`,
  );
  const recentShipments = await query(
    `select * from shipments where archived_at is null order by created_at desc limit 6`,
  );
  const recentEvents = await query(
    `${EVENT_SELECT} order by e.created_at desc limit 8`,
  );
  const recentEvidence = await query(`${EVIDENCE_SELECT} order by ev.created_at desc limit 6`);
  const stats = rows[0];
  return {
    total: stats?.total ?? 0,
    active: stats?.active ?? 0,
    delivered: stats?.delivered ?? 0,
    exceptions: stats?.exceptions ?? 0,
    inTransit: stats?.in_transit ?? 0,
    pickupScheduled: stats?.pickup_scheduled ?? 0,
    evidence: stats?.evidence ?? 0,
    recentShipments: recentShipments.map(mapShipment),
    recentEvents: recentEvents.map(mapEvent),
    recentEvidence: recentEvidence.map(mapEvidence),
  };
}

export async function listActivity(limit = 80) {
  const rows = await query(
    `select * from admin_activity order by created_at desc limit $1`,
    [Math.min(200, Math.max(1, limit))],
  );
  return rows.map((row) => ({
    id: asString(row.id),
    actorEmail: asString(row.actor_email),
    action: asString(row.action),
    resource: asString(row.resource),
    resourceId: asString(row.resource_id),
    ip: asString(row.ip),
    createdAt: iso(row.created_at),
    metadata: row.metadata ?? {},
  }));
}

export async function listUsers() {
  const rows = await query(
    `select id, email, name, role, auth_provider, is_active, last_login_at, created_at from admin_users order by created_at asc`,
  );
  return rows.map((row) => ({
    id: asString(row.id),
    email: asString(row.email),
    name: asString(row.name),
    role: asString(row.role) as Role,
    authProvider: asString(row.auth_provider),
    isActive: asBool(row.is_active),
    lastLoginAt: iso(row.last_login_at),
    createdAt: iso(row.created_at),
  }));
}

export async function purgeDemo() {
  const files = await withTransaction(async (q) => {
    await q("select set_config('nkdon.purge', 'on', true)");
    const evidence = await q("select file_path from shipment_evidence where is_demo = true or shipment_id in (select id from shipments where is_demo = true)");
    await q("delete from shipment_evidence where is_demo = true or shipment_id in (select id from shipments where is_demo = true)");
    await q("delete from shipment_events where shipment_id in (select id from shipments where is_demo = true)");
    await q("delete from shipments where is_demo = true");
    await q("delete from facilities where is_demo = true and not exists (select 1 from shipments s where s.origin_facility_id = facilities.id or s.destination_facility_id = facilities.id or s.current_facility_id = facilities.id)");
    return evidence.rows.map((row) => asString(row.file_path));
  });
  return files;
}

export async function saveInquiry(input: { name: string; email: string; phone?: string; topic?: string; message: string }) {
  const rows = await query<{ id: string }>(
    `insert into inquiries (name, email, phone, topic, message, notification_status)
     values ($1,$2,$3,$4,$5,'not_configured') returning id`,
    [input.name, input.email, input.phone ?? "", input.topic ?? "", input.message],
  );
  return asString(rows[0].id);
}
