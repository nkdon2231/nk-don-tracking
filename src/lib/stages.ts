import { HAPPY_PATH, SERVICE_TYPES, STATUS_LABEL, type ShipmentStatus } from "./constants";

export const EVIDENCE_STAGES = [
  { id: "all", label: "All", types: null },
  { id: "package", label: "Package", types: ["Package", "Package Condition"] },
  { id: "pickup", label: "Pickup", types: ["Pickup/Handover"] },
  { id: "warehouse", label: "Warehouse", types: ["Facility"] },
  { id: "transit", label: "Transit", types: ["Transportation", "Air Cargo", "Vehicle"] },
  { id: "customs", label: "Customs", types: ["Customs", "Clearance"] },
  { id: "documents", label: "Documents", types: ["Documents", "Waybill"] },
  { id: "courier", label: "Courier", types: ["Courier"] },
  { id: "delivery", label: "Delivery", types: ["Delivery", "Signature"] },
  { id: "exception", label: "Exception", types: ["Exception"] },
] as const;

export type EvidenceStageId = (typeof EVIDENCE_STAGES)[number]["id"];

const STATUS_STAGE: Record<string, EvidenceStageId> = {
  pickup_scheduled: "pickup",
  picked_up: "pickup",
  processing: "warehouse",
  arrived_at_facility: "warehouse",
  in_transit: "transit",
  customs_clearance: "customs",
  out_for_delivery: "delivery",
  delivered: "delivery",
  exception: "exception",
  cancelled: "exception",
};

export function evidenceStageForStatus(status: string): EvidenceStageId {
  return STATUS_STAGE[status] ?? "all";
}

export function vehicleKind(serviceType: string): "parcel" | "van" | "air" | "freight" {
  const code = SERVICE_TYPES.find((item) => item.value === serviceType || item.label === serviceType)?.value ?? serviceType;
  if (code === "air_cargo") return "air";
  if (code === "international_freight" || code === "consignment") return "freight";
  if (code === "express_courier" || code === "ground_transportation" || code === "pickup_delivery") return "van";
  return "parcel";
}

export type JourneyMarker = {
  id: string;
  label: string;
  state: "done" | "current" | "upcoming" | "alert";
};

export function journeyMarkers(
  status: string,
  occurred: Iterable<string>,
): JourneyMarker[] {
  const seen = new Set(occurred);
  const alert = status === "exception" || status === "cancelled";
  return HAPPY_PATH.map((step) => ({
    id: step,
    label: STATUS_LABEL[step as ShipmentStatus],
    state: status === step ? (alert ? "alert" : "current") : seen.has(step) ? "done" : "upcoming",
  }));
}
