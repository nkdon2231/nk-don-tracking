import Link from "next/link";
import { HeroBackdrop } from "@/components/hero-aircraft";
import { PublicFrame } from "@/components/site-chrome";
import { BRAND } from "@/lib/constants";
import { SERVICES, STEPS } from "@/lib/site-content";

const featured = ["air_cargo", "international_freight", "warehousing", "pickup_delivery"];

export default function HomePage() {
  const spotlight = SERVICES.filter((service) => featured.includes(service.value));
  return (
    <PublicFrame hero>
      <section className="home-hero">
        <HeroBackdrop />
        <div className="home-hero-copy">
          <p className="home-hero-kicker">{BRAND.positioning}</p>
          <h1 className="home-hero-title">
            NKDON
            <span>Global Logistics</span>
          </h1>
          <p className="home-hero-lead">
            Parcels, documents, freight, and consignments stay on one record. Staff open the shipment. You follow the tracking number they issue.
          </p>
        </div>
        <div className="home-hero-track-wrap">
          <form className="hero-track" action="/track" method="get">
            <div className="hero-track-head">
              <span className="hero-track-pin" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.2" />
                </svg>
              </span>
              <div>
                <h2>Track a shipment</h2>
                <p>Enter the number staff issued. You will see recorded events, not a live position.</p>
              </div>
            </div>
            <div className="hero-track-row">
              <label className="sr-only" htmlFor="hero-tracking-number">
                Tracking number
              </label>
              <input id="hero-tracking-number" name="number" placeholder="NKD-YYYYMMDD-XXXX" autoComplete="off" spellCheck={false} maxLength={40} />
              <button type="submit">Track</button>
            </div>
          </form>
        </div>
        <ul className="home-hero-facts">
          <li>
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.8 2.5 15.2 0 18M12 3c-2.5 2.8-2.5 15.2 0 18" />
              </svg>
            </span>
            <div>
              <strong>Recorded tracking</strong>
              <p>Updates when staff log an event</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 9 4.2-1.8 7-4.8 7-9V6l-7-3z" />
                <path d="m8.5 12 2.2 2.2 4.8-5" />
              </svg>
            </span>
            <div>
              <strong>Private by default</strong>
              <p>Names and notes stay off the public page</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="4" y="7" width="16" height="11" rx="2" />
                <path d="M8 7V5h8v2M4 12h16" />
              </svg>
            </span>
            <div>
              <strong>Staff-set timing</strong>
              <p>A window only after a lane is published</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                <path d="M8 16V8a4 4 0 0 1 8 0v8" />
                <path d="M8 13h2M14 13h2" />
              </svg>
            </span>
            <div>
              <strong>Operations desk</strong>
              <p>Messages are stored for staff</p>
            </div>
          </li>
        </ul>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <article key={step.title} className="card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-copper)]">0{index + 1}</p>
            <h2 className="serif mt-2 text-2xl">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{step.copy}</p>
          </article>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="serif text-4xl">Movements we book</h2>
          <Link href="/services" className="text-sm text-[var(--color-lane)] no-underline">
            All services
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {spotlight.map((service) => (
            <Link key={service.value} href={`/services#${service.value}`} className="card group overflow-hidden no-underline">
              <img src={service.image} alt={service.alt} className="h-52 w-full object-cover" />
              <div className="p-5">
                <h3 className="font-semibold">{service.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{service.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-12 lg:grid-cols-2">
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
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="card grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
          <div>
            <h2 className="serif text-2xl">Book</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Ask for a pickup or a quote. Staff open the shipment. The site does not price it.</p>
            <Link className="mt-3 inline-block text-sm font-semibold text-[var(--color-copper)] no-underline" href="/book">
              Request a pickup
            </Link>
          </div>
          <div>
            <h2 className="serif text-2xl">Follow</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Enter NKD-YYYYMMDD-XXXX. Names and internal notes are not on that page.</p>
            <Link className="mt-3 inline-block text-sm font-semibold text-[var(--color-copper)] no-underline" href="/track">
              Open tracking
            </Link>
          </div>
          <div>
            <h2 className="serif text-2xl">Ask</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Status meanings, a missing update, customs papers, and the contact form.</p>
            <Link className="mt-3 inline-block text-sm font-semibold text-[var(--color-copper)] no-underline" href="/support">
              Support center
            </Link>
          </div>
        </div>
      </section>
    </PublicFrame>
  );
}
