import Link from "next/link";
import { RequestForm } from "@/components/request-form";
import { PublicFrame } from "@/components/site-chrome";
import { pageMeta } from "@/lib/seo";
import { SERVICE_TYPES } from "@/lib/constants";

export const metadata = pageMeta({
  title: "Get a quote",
  description: "Ask QCORVAZENT to review an international shipment from Dubai. The site does not calculate a price.",
  path: "/quote",
});

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const initial = SERVICE_TYPES.some((item) => item.value === service) ? service : "";
  return (
    <PublicFrame>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Get a quote</p>
          <h1 className="serif mt-3 text-5xl leading-[0.95]">Ask the desk to price the movement.</h1>
          <p className="mt-4 leading-7 text-[var(--color-muted)]">
            QCORVAZENT does not run an automatic price. The form saves a pending request for an international courier or express movement. Staff reply from the operations queue. Email delivery is not active, so do not wait for an automatic message.
          </p>
          <p className="mt-4 text-sm leading-6">
            Need the goods collected? <Link href="/book">Request a pickup</Link> instead. That still waits for staff before a tracking number exists.
          </p>
        </div>
        <RequestForm kind="quote" initialService={initial} />
      </section>
    </PublicFrame>
  );
}
