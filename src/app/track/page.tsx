import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";
import { TrackPanel } from "@/components/track-panel";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Track a shipment",
  description: "Follow a QCORVAZENT shipment with the number NKD-YYYYMMDD-XXXX. Proof files appear only when staff release them.",
  path: "/track",
});

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ number?: string }> }) {
  const { number } = await searchParams;
  return (
    <PublicFrame>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">QCORVAZENT Tracking</p>
        <h1 className="serif mt-2 text-5xl">Follow a consignment</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--color-muted)]">
          Use the number issued by QCORVAZENT. It looks like NKD-YYYYMMDD-XXXX. Proof shows the recipient name and any public photos, driver video, or signature staff released. Phone numbers, email addresses, street addresses, and internal notes stay off this page. Locations are recorded events, not live GPS.
        </p>
        <div className="mt-6">
          <TrackPanel initialNumber={number ?? ""} />
        </div>
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          Number refused or not found? <Link href="/support/tracking">Read tracking help</Link> or <Link href="/contact?topic=Tracking%20assistance">send it to the desk</Link>.
        </p>
      </section>
    </PublicFrame>
  );
}