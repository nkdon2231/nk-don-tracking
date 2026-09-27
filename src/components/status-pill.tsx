import { STATUS_LABEL, type ShipmentStatus } from "@/lib/constants";

export function StatusPill({ status }: { status: string }) {
  const label = STATUS_LABEL[status as ShipmentStatus] ?? status;
  const tone =
    status === "delivered" ? "badge-live" : status === "exception" || status === "cancelled" ? "badge-warn" : "badge";
  return <span className={`badge ${tone}`}>{label}</span>;
}
