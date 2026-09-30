import Link from "next/link";
import { RequestForm } from "@/components/request-form";
import { PublicFrame } from "@/components/site-chrome";
import { pageMeta } from "@/lib/seo";
import { SERVICE_TYPES } from "@/lib/constants";

export const metadata = pageMeta({
  title: "Request a pickup",
  description: "Ask QCORVAZENT to review a pickup. A tracking number is issued only after staff open the shipment.",
  path: "/book",
});

export default async function BookPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const initial = SERVICE_TYPES.some((item) => item.value === service) ? service : "";
  return (
    <PublicFrame>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Shipment request</p>
          <h1 className="serif mt-3 text-5xl leading-[0.95]">Request a pickup. Staff confirm it.</h1>
          <p className="mt-4 leading-7 text-[var(--color-muted)]">
            The recipient name has to be yours to give. Operations will not invent one. If they open the shipment, its first status is pickup scheduled, and that is when the QCORVAZENT tracking number exists.
          </p>
          <p className="mt-4 text-sm leading-6">
            Only pricing so far? <Link href="/quote">Get a quote</Link>. Already booked? <Link href="/track">Track the number</Link>.
          </p>
        </div>
        <RequestForm kind="booking" initialService={initial} />
      </section>
    </PublicFrame>
  );
}
