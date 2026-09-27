import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";
import { QUESTIONS } from "@/lib/site-content";

export const metadata = {
  title: "FAQ",
  description: "How NKDON tracking numbers, public updates, documents, and contact messages work.",
};

export default function FaqPage() {
  return (
    <PublicFrame>
      <section className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">FAQ</p>
        <h1 className="serif mt-3 text-5xl leading-[0.95]">Questions before you track or write in.</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
          Short answers about the number, what the public page shows, and what the contact form does not do.
        </p>
        <div className="mt-8 grid gap-3">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="card p-5">
              <summary className="font-semibold">{item.q}</summary>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/track">
            Track a shipment
          </Link>
          <Link className="btn btn-ghost" href="/contact">
            Ask the desk
          </Link>
        </div>
      </section>
    </PublicFrame>
  );
}
