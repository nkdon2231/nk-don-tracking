import { Suspense } from "react";
import { ShipmentList } from "@/components/admin/shipment-list";

export const metadata = { title: "Shipments" };

export default function ShipmentsPage() {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-sm text-[var(--color-muted)]">Opening shipments…</p>}>
      <ShipmentList />
    </Suspense>
  );
}
