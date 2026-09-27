import type { Metadata } from "next";
import { PublicShell } from "@/components/site";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PublicShell current="/about">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-steel">About</p>
        <h1 className="mt-2 text-4xl font-semibold">{BRAND.name}</h1>
        <p className="mt-5 text-lg leading-8 text-steel">
          NKDON is an operations-led logistics company. The public site and the operations desk share one shipment record: origin, destination, status, events, facilities, and evidence.
        </p>
        <div className="mt-8 space-y-4 text-sm leading-7 text-steel">
          <p>Customers track without an account. Staff sign in through the existing administrator session, not a separate marketing login.</p>
          <p>Demonstration shipments are labelled. Production records stay on the configured Supabase database and are not mixed with local preview data.</p>
        </div>
      </div>
    </PublicShell>
  );
}
