import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";
import { TrackPanel } from "@/components/track-panel";
import { BRAND } from "@/lib/constants";
import { SERVICES, STEPS } from "@/lib/site-content";

const featured = ["air_cargo", "international_freight", "warehousing", "pickup_delivery"];

export default function HomePage() {
  const spotlight = SERVICES.filter((service) => featured.includes(service.value));
  return (
    <PublicFrame>
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="relative min-h-[34rem] overflow-hidden rounded-[1.8rem] bg-[var(--color-pine)]">
          <img src="/images/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#10211c] via-[#10211c]/88 to-[#10211c]/25" />
          <div className="relative flex min-h-[34rem] max-w-xl flex-col justify-end p-7 text-[var(--color-paper)] sm:p-12">
            <p className="text-xs uppercase tracking-[0.22em] text-[#e7c7ae]">{BRAND.positioning}</p>
            <h1 className="serif mt-4 text-5xl leading-[0.95] sm:text-6xl">{BRAND.tagline}</h1>
            <p className="mt-5 text-base leading-7 text-white/80">
              Parcels, documents, freight, and consignments stay on one NKDON record. Customers follow the tracking number. The operational file stays with staff.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="btn btn-copper" href="/track">
                Track a shipment
              </Link>
              <Link className="btn border border-white/30 text-white" href="/services">
                View services
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <TrackPanel />
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-6 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <article key={step.title} className="card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-copper)]">0{index + 1}</p>
            <h2 className="serif mt-2 text-2xl">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{step.copy}</p>
          </article>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="serif text-4xl">Movements we book</h2>
          <Link href="/services" className="text-sm">
            All services
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {spotlight.map((service) => (
            <Link key={service.value} href={`/services#${service.value}`} className="group overflow-hidden rounded-[1.4rem] bg-white no-underline">
              <img src={service.image} alt={service.alt} className="h-52 w-full object-cover" />
              <div className="p-5">
                <h3 className="font-semibold">{service.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{service.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 lg:grid-cols-2">
        <img src="/images/documents.jpg" alt="Shipping documents prepared for a consignment" className="h-80 w-full rounded-[1.6rem] object-cover" />
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Evidence</p>
          <h2 className="serif mt-2 text-4xl">Proof stays with the shipment</h2>
          <p className="mt-4 leading-7 text-[var(--color-muted)]">
            Photos and PDFs are stored in a private bucket. A document appears on the public tracking page only after operations marks it public. Internal notes never do.
          </p>
          <Link className="btn btn-primary mt-6" href="/about">
            About the record
          </Link>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-6 rounded-[1.5rem] bg-white p-6 sm:grid-cols-3 sm:p-8">
          <div>
            <h2 className="serif text-2xl">Book</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Tell operations what is moving. The number comes back from the desk.</p>
            <Link className="mt-3 inline-block text-sm font-semibold" href="/contact">
              Request a movement
            </Link>
          </div>
          <div>
            <h2 className="serif text-2xl">Follow</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Enter NKD-YYYYMMDD-XXXX. Names and internal notes are not on that page.</p>
            <Link className="mt-3 inline-block text-sm font-semibold" href="/track">
              Open tracking
            </Link>
          </div>
          <div>
            <h2 className="serif text-2xl">Ask</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Number format, public files, and what the contact form does not send.</p>
            <Link className="mt-3 inline-block text-sm font-semibold" href="/faq">
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </PublicFrame>
  );
}
