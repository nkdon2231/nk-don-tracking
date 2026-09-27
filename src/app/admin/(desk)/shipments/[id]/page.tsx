import { ShipmentDetail } from "@/components/admin/shipment-detail";

export const metadata = { title: "Shipment" };

export default async function ShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShipmentDetail id={id} />;
}
