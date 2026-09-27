import { STATUS_LABEL, type ShipmentStatus } from "./constants";

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function place(city?: string | null, country?: string | null) {
  return [city, country].filter(Boolean).join(", ") || "—";
}

export function statusTone(status: string) {
  if (status === "delivered") return "bg-emerald-100 text-emerald-800";
  if (status === "exception") return "bg-red-100 text-red-800";
  if (status === "cancelled") return "bg-zinc-200 text-zinc-700";
  if (status === "out_for_delivery") return "bg-amber-100 text-amber-900";
  if (status === "in_transit" || status === "customs_clearance") return "bg-sky-100 text-sky-900";
  return "bg-neutral-200 text-neutral-800";
}

export function statusLabel(status: string) {
  return STATUS_LABEL[status as ShipmentStatus] ?? status.replaceAll("_", " ");
}

export function bytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
