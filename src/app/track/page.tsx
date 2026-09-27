import { PublicFrame } from "@/components/site-chrome";
import { TrackPanel } from "@/components/track-panel";

export const metadata = { title: "Track a shipment" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ number?: string }> }) {
  const { number } = await searchParams;
  return (
    <PublicFrame>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Customer tracking</p>
        <h1 className="serif mt-2 text-5xl">Follow a consignment</h1>
        <p className="mt-3 max-w-2xl text-[var(--color-muted)]">
          Use the number issued by NKDON. It looks like NKD-YYYYMMDD-XXXX. Sender, recipient, and internal notes are not shown here.
        </p>
        <div className="mt-6">
          <TrackPanel initialNumber={number ?? ""} />
        </div>
      </section>
    </PublicFrame>
  );
}
