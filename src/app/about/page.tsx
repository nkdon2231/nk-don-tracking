import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";
import { BRAND } from "@/lib/constants";
import { STEPS } from "@/lib/site-content";

export const metadata = {
  title: "About",
  description: "NKDON Global Logistics books courier, freight, and consignment movements, and publishes only what the customer should see.",
};

export default function AboutPage() {
  return (
    <PublicFrame>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">About {BRAND.short}</p>
          <h1 className="serif mt-3 text-5xl leading-[0.95] sm:text-6xl">A logistics desk with a public tracking window.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--color-muted)]">
            NKDON Global Logistics moves parcels, documents, freight, and consignments. The public site is where a customer follows the number they were given. Booking, notes, and private files stay with staff.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/services">
              See the services
            </Link>
            <Link className="btn btn-ghost" href="/contact">
              Talk to the desk
            </Link>
          </div>
        </div>
        <img src="/images/control.jpg" alt="An operations desk reviewing a shipment" className="h-80 w-full rounded-[1.6rem] object-cover lg:h-[28rem]" />
      </section>
      <section className="mx-auto max-w-6xl px-4">
        <h2 className="serif text-4xl">How a shipment is kept</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <article key={step.title} className="card p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-copper)]">0{index + 1}</p>
              <h3 className="serif mt-2 text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{step.copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 lg:grid-cols-2">
        <article className="rounded-[1.5rem] bg-white p-6 sm:p-8">
          <h2 className="serif text-3xl">Shown on tracking</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-6">
            <li>Status, and the timeline that produced it</li>
            <li>Origin and destination cities, when they were recorded</li>
            <li>Package count, weight, and the public description</li>
            <li>Photos and PDFs staff marked public</li>
          </ul>
        </article>
        <article className="rounded-[1.5rem] bg-[var(--color-pine)] p-6 text-[var(--color-paper)] sm:p-8">
          <h2 className="serif text-3xl">Kept on the desk</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-white/80">
            <li>Sender and recipient names</li>
            <li>Phone numbers, emails, and street addresses</li>
            <li>Internal notes and the staff activity log</li>
            <li>Private evidence in the shipment-evidence bucket</li>
          </ul>
        </article>
      </section>
      <section className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-14 lg:grid-cols-2">
        <img src="/images/warehouse.jpg" alt="Goods held before the next leg" className="h-72 w-full rounded-[1.6rem] object-cover" />
        <div>
          <h2 className="serif text-4xl">No invented routes</h2>
          <p className="mt-4 leading-7 text-[var(--color-muted)]">
            The site does not publish sample customers, made-up volumes, or a tracking number that was never booked. If a record is marked DEMO / TEST, the tracking page says so.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-copper" href="/track">
              Track a shipment
            </Link>
            <Link className="btn btn-ghost" href="/faq">
              Common questions
            </Link>
          </div>
        </div>
      </section>
    </PublicFrame>
  );
}
