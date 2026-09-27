import { ShipmentForm } from "@/components/admin/shipment-form";

export default function NewShipmentPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Create shipment</h1>
      <p className="text-sm text-steel">A tracking number is allocated by the server when the record is saved.</p>
      <ShipmentForm />
    </div>
  );
}
