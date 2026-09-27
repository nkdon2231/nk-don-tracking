import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";
import { SERVICES } from "@/lib/site-content";

export const metadata = {
  title: "Services",
  description: "Express courier, international freight, air cargo, warehousing, customs papers, and consignment tracking from NKDON.",
};

export default function ServicesPage() {
  return (
    <PublicFrame>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Services</p>
        <h1 className="serif mt-3 max-w-3xl text-5xl leading-[0.95] sm:text-6xl">Different movements. The same kind of record.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
          Courier, freight, air, road, storage, and papers are not the same job. Staff book the one that fits. Each booking receives its own tracking number, and the timeline is a list of events.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/contact">
            Request a movement
          </Link>
          <Link className="btn btn-ghost" href="/track">
            Track a shipment
          </Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-8">
        {SERVICES.map((service, index) => (
          <article id={service.value} key={service.value} className="card scroll-mt-28 grid overflow-hidden md:grid-cols-[0.86fr_1.14fr]">
            <img src={service.image} alt={service.alt} className={`h-56 w-full object-cover md:h-full md:min-h-72 ${index % 2 ? "md:order-2" : ""}`} />
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-copper)]">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="serif mt-2 text-3xl">{service.label}</h2>
              <p className="mt-3 max-w-xl leading-7 text-[var(--color-ink)]">{service.summary}</p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">{service.detail}</p>
              <ul className="mt-4 grid list-disc gap-1 pl-4 text-sm">
                {service.covers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-[var(--color-lane)]">{service.suited}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-[1.5rem] bg-[var(--color-pine)] px-6 py-8 text-[var(--color-paper)] sm:px-10">
          <h2 className="serif text-3xl">A tracking number is issued when the shipment is created.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
            Tell the desk the cities, what is moving, and any timing you already know. This page does not book the cargo by itself.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-copper" href="/contact">
              Contact operations
            </Link>
            <Link className="btn border border-white/30 text-white" href="/faq">
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </PublicFrame>
  );
}
