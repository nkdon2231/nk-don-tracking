import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <PublicFrame>
      <section className="mx-auto max-w-3xl px-4 py-20">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">404</p>
        <h1 className="serif mt-3 text-5xl">This page is not on the site.</h1>
        <p className="mt-4 text-[var(--color-muted)]">If you have a tracking number, open Track and enter it. The number itself is not a web address.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/track">
            Track a shipment
          </Link>
          <Link className="btn btn-ghost" href="/">
            Back home
          </Link>
          <Link className="btn btn-ghost" href="/contact">
            Contact
          </Link>
        </div>
      </section>
    </PublicFrame>
  );
}
