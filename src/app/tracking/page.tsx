import { PublicShell } from "@/components/site";
import { TrackBox } from "@/components/track-box";
import { TrackingResult } from "@/components/tracking-result";

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string }>;
}) {
  const params = await searchParams;
  const number = (params.number ?? "").trim().toUpperCase();

  return (
    <PublicShell current="/tracking">
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Shipment tracking</p>
          <h1 className="mt-3 text-4xl font-semibold">Follow the movement, not just a status label.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Public tracking reads live shipment records. No account is required.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <TrackBox initial={number || "NKD-20260924-4034"} />
        {number ? <TrackingResult number={number} /> : null}
      </div>
    </PublicShell>
  );
}
