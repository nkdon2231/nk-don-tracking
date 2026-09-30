import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";
import { pageMeta } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/constants";
import { STATUS_HELP } from "@/lib/site-content";

export const metadata = pageMeta({
  title: "Tracking help",
  description: "How to find a QCORVAZENT tracking number, what each status means, and what to do if it has not updated.",
  path: "/support/tracking",
});

export default function TrackingHelpPage() {
  return (
    <PublicFrame>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Tracking help</p>
        <h1 className="serif mt-3 text-5xl leading-[0.95]">The number, the stages, and a quiet page.</h1>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="card p-6">
            <h2 className="serif text-2xl">Where to find the tracking number</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Staff issue it when they open the shipment. It looks like NKD-YYYYMMDD-XXXX. The date is the day the number was created. The last four digits are assigned by the desk. A company reference is not a substitute on the public page.
            </p>
            <Link className="mt-4 inline-block text-sm font-semibold text-[var(--color-copper)] no-underline" href="/track">
              Open tracking
            </Link>
          </article>
          <article className="card p-6">
            <h2 className="serif text-2xl">If tracking has not updated</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              The page does not follow a vehicle. A new line appears when staff record an event. Check the characters and the dashes. If the number is right and the window you were given has passed, send that number to the desk. Do not expect an email reply until a mail provider is connected.
            </p>
            <Link className="mt-4 inline-block text-sm font-semibold text-[var(--color-copper)] no-underline" href="/contact?topic=Tracking%20assistance">
              Contact support
            </Link>
            <p className="mt-4 text-sm leading-6">
              <span className="block text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Customer Support Email</span>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[var(--color-copper)] no-underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </article>
        </div>
        <h2 className="serif mt-12 text-4xl">What each stage means</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          These are the statuses the desk can record. A stage you have not reached yet is not a promise that it will happen.
        </p>
        <div className="mt-6 grid gap-4">
          {STATUS_HELP.map((item) => (
            <article key={item.status} id={item.status === "delivered" || item.status === "out_for_delivery" ? "delivery" : item.status} className="card p-5">
              <h3 className="font-semibold">{item.label}</h3>
              <p className="mt-2 text-sm leading-6">{item.means}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{item.next}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicFrame>
  );
}
