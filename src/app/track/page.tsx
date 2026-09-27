import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";
import { TrackPanel } from "@/components/track-panel";

export const metadata = {
  title: "Track a shipment",
  description: "Follow an NKDON shipment with the number NKD-YYYYMMDD-XXXX. Names and internal notes are not shown.",
};

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ number?: string }> }) {
  const { number } = await searchParams;
  return (
    <PublicFrame>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Customer tracking</p>
        <h1 className="serif mt-2 text-5xl">Follow a consignment</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--color-muted)]">
          Use the number issued by NKDON. It looks like NKD-YYYYMMDD-XXXX. You will see status, cities, the recorded route when coordinates exist, and files marked public. Sender, recipient, staff notes, and courier contact details are not on this page. Locations are recorded events, not live GPS.
        </p>
        <div className="mt-6">
          <TrackPanel initialNumber={number ?? ""} />
        </div>
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          Number refused or not found? <Link href="/faq">Check the FAQ</Link> or <Link href="/contact">send it to the desk</Link>.
        </p>
      </section>
    </PublicFrame>
  );
}