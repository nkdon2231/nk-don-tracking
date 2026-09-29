import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";
import { ProofLookup } from "@/components/proof-dossier";

export const metadata = {
  title: "Proof of delivery",
  description: "QCORVAZENT shipment receipt and proof of delivery. Shows stored records only. Photos, video, and signatures appear when staff release them.",
};

export default async function ProofPage({ searchParams }: { searchParams: Promise<{ number?: string }> }) {
  const { number } = await searchParams;
  return (
    <PublicFrame>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">QCORVAZENT Proof</p>
        <h1 className="serif mt-2 text-5xl">Receipt and proof</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--color-muted)]">
          The QR code on a shipment opens this page. It shows the tracking number, barcode, recipient name, and delivery time and place when those were recorded. Photos, driver video, and a signature appear only after staff upload them and mark them public. Missing proof stays blank.
        </p>
        <div className="mt-6">
          <ProofLookup initialNumber={number ?? ""} />
        </div>
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          Looking for status only? <Link href={number ? `/track?number=${encodeURIComponent(number)}` : "/track"}>Open tracking</Link>.
        </p>
      </section>
    </PublicFrame>
  );
}
