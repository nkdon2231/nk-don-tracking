export const BRAND = {
  name: "NKDON Global Logistics",
  short: "NKDON",
  tagline: "Moving what matters. Across borders. With confidence.",
  positioning: "Global Logistics · Freight · Courier · Consignment · Shipment Tracking",
} as const;

export const STATUSES = [
  "pickup_scheduled",
  "picked_up",
  "processing",
  "in_transit",
  "arrived_at_facility",
  "customs_clearance",
  "out_for_delivery",
  "delivered",
  "exception",
  "cancelled",
] as const;

export type ShipmentStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up",
  processing: "Processing",
  in_transit: "In Transit",
  arrived_at_facility: "Arrived at Facility",
  customs_clearance: "Customs Clearance",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  exception: "Exception",
  cancelled: "Cancelled",
};

export const HAPPY_PATH: ShipmentStatus[] = [
  "pickup_scheduled",
  "picked_up",
  "processing",
  "in_transit",
  "arrived_at_facility",
  "customs_clearance",
  "out_for_delivery",
  "delivered",
];

export const SERVICE_TYPES = [
  { value: "express_courier", label: "Express Courier" },
  { value: "international_freight", label: "International Freight" },
  { value: "air_cargo", label: "Air Cargo" },
  { value: "ground_transportation", label: "Ground Transportation" },
  { value: "warehousing", label: "Warehousing" },
  { value: "pickup_delivery", label: "Pickup & Delivery" },
  { value: "customs_documentation", label: "Customs & Documentation" },
  { value: "business_logistics", label: "Business Logistics" },
  { value: "consignment", label: "Consignment Management" },
  { value: "secure_tracking", label: "Secure Shipment Tracking" },
] as const;

export const SHIPMENT_TYPES = [
  { value: "parcel", label: "Parcel" },
  { value: "document", label: "Document" },
  { value: "freight", label: "Freight" },
  { value: "consignment", label: "Consignment" },
] as const;

export const FACILITY_TYPES = [
  "Headquarters",
  "Warehouse",
  "Sorting Center",
  "Airport",
  "Distribution Center",
  "Delivery Hub",
  "Customs Facility",
] as const;

export const EVIDENCE_TYPES = [
  "Package",
  "Pickup/Handover",
  "Transportation",
  "Air Cargo",
  "Facility",
  "Customs",
  "Documents",
  "Delivery",
  "Exception",
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const ROLES = ["super_admin", "admin", "operations", "support", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  operations: "Operations",
  support: "Support",
  viewer: "Viewer",
};

export const TRACKING_RE = /^NKD-\d{8}-\d{4}$/;

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const PDF_MAX_BYTES = 20 * 1024 * 1024;

export type Action =
  | "shipments:read"
  | "shipments:write"
  | "events:write"
  | "evidence:write"
  | "evidence:delete"
  | "evidence:visibility"
  | "facilities:write"
  | "users:write"
  | "settings:write"
  | "demo:purge"
  | "shipments:archive"
  | "notes:read";

const RANK: Record<Role, number> = {
  viewer: 1,
  support: 2,
  operations: 3,
  admin: 4,
  super_admin: 5,
};

export function can(role: Role, action: Action): boolean {
  switch (action) {
    case "shipments:read":
    case "notes:read":
      return action === "notes:read" ? RANK[role] >= 2 : true;
    case "events:write":
      return RANK[role] >= 2;
    case "shipments:write":
    case "evidence:write":
      return RANK[role] >= 3;
    case "evidence:delete":
    case "evidence:visibility":
    case "facilities:write":
    case "shipments:archive":
      return RANK[role] >= 4;
    case "users:write":
    case "settings:write":
    case "demo:purge":
      return RANK[role] >= 5;
    default:
      return false;
  }
}

export function labelFor<T extends { value: string; label: string }>(list: readonly T[], value: string) {
  return list.find((item) => item.value === value)?.label ?? value;
}

export function serviceLabel(value: string) {
  return labelFor(SERVICE_TYPES, value);
}

export function shipmentTypeLabel(value: string) {
  return labelFor(SHIPMENT_TYPES, value);
}
