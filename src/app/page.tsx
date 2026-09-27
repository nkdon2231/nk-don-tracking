import Link from "next/link";
import { PublicShell } from "@/components/site";
import { TrackBox } from "@/components/track-box";
import { BRAND, SERVICE_TYPES } from "@/lib/constants";

const CAPABILITIES = [
  { title: "Air cargo", copy: "Time-critical freight with documented handoffs from origin warehouse to destination apron." },
  { title: "Ocean & containers", copy: "Full and consolidated loads with facility-level visibility through customs and inland delivery." },
  { title: "Courier & last mile", copy: "Pickup windows, proof of handover, and delivery confirmation for parcels and documents." },
  { title: "Warehousing", copy: "Secure holding, sortation, and release against consignment instructions." },
];

export default function HomePage() {
  return (
    <PublicShell current="/">
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{BRAND.positioning}</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Moving what matters. Across borders. With confidence.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
              NKDON runs freight, courier, and consignment operations with a single tracking record — status, facilities, events, and evidence in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className="rounded-xl bg-gold px-5 py-3 font-semibold text-ink">
                Request pickup
              </Link>
              <Link href="/services" className="rounded-xl border border-white/20 px-5 py-3 text-white">
                View services
              </Link>
            </div>
          </div>
          <TrackBox initial="NKD-20260924-4034" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-steel">Capabilities</p>
        <h2 className="mt-2 text-3xl font-semibold">A controlled path from pickup to proof of delivery.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {CAPABILITIES.map((item) => (
            <article key={item.title} className="rounded-2xl border border-line bg-white p-6">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-steel">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-steel">Services</p>
          <h2 className="mt-2 text-3xl font-semibold">Built for operators, not brochure shipping.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SERVICE_TYPES.map((service) => (
              <div key={service.value} className="rounded-xl border border-line bg-cream px-4 py-4 text-sm font-medium">
                {service.label}
              </div>
            ))}
          </div>
          <Link href="/services" className="mt-6 inline-block text-sm font-semibold underline">
            Explore the service catalogue
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
