import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";
import { TrackPanel } from "@/components/track-panel";
import { BRAND, SERVICE_TYPES } from "@/lib/constants";

const scenes = [
  { src: "/images/warehouse.jpg", label: "Warehousing" },
  { src: "/images/aircargo.jpg", label: "Air cargo" },
  { src: "/images/containers.jpg", label: "Freight" },
  { src: "/images/van.jpg", label: "Delivery" },
];

export default function HomePage() {
  return (
    <PublicFrame>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-copper)]">{BRAND.positioning}</p>
          <h1 className="serif mt-3 text-5xl leading-[0.95] sm:text-6xl">{BRAND.tagline}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--color-muted)]">
            NKDON moves parcels, documents, freight, and consignments. Customers follow a shipment with its tracking number. Operational records stay with staff.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/track">
              Track a shipment
            </Link>
            <Link className="btn btn-ghost" href="/contact">
              Request a movement
            </Link>
          </div>
        </div>
        <img src="/images/hero.jpg" alt="Freight prepared for movement" className="h-80 w-full rounded-[1.6rem] object-cover sm:h-[28rem]" />
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <TrackPanel />
      </section>
      <section id="services" className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="serif text-4xl">What we carry</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_TYPES.map((service) => (
            <article key={service.value} className="card p-4">
              <h3 className="font-semibold">{service.label}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Booked and updated by the NKDON operations desk. Status changes are recorded as shipment events, not overwritten.
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-4">
        {scenes.map((scene) => (
          <figure key={scene.src} className="overflow-hidden rounded-2xl">
            <img src={scene.src} alt="" className="h-40 w-full object-cover" />
            <figcaption className="bg-white px-3 py-2 text-sm">{scene.label}</figcaption>
          </figure>
        ))}
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-2">
        <img src="/images/documents.jpg" alt="Shipping documents on a desk" className="h-72 w-full rounded-[1.6rem] object-cover" />
        <div className="flex flex-col justify-center">
          <h2 className="serif text-4xl">Proof stays with the shipment</h2>
          <p className="mt-4 leading-7 text-[var(--color-muted)]">
            Photos and PDFs are stored privately. A document appears on the public tracking page only after operations marks it public. Internal notes never do.
          </p>
          <Link className="btn btn-copper mt-6 w-fit" href="/contact">
            Talk to the desk
          </Link>
        </div>
      </section>
    </PublicFrame>
  );
}
