import Link from "next/link";
import { EstimateForm } from "@/components/estimate-form";
import { PublicFrame } from "@/components/site-chrome";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Delivery window",
  description: "Check a transit window only when QCORVAZENT staff have published one for that lane.",
  path: "/estimate",
});

export default function EstimatePage() {
  return (
    <PublicFrame>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Delivery estimator</p>
          <h1 className="serif mt-3 text-5xl leading-[0.95]">A window only when staff published one.</h1>
          <p className="mt-4 leading-7 text-[var(--color-muted)]">
            The estimator reads transit windows from the operations desk. It does not invent days, and it does not look at live traffic. No published lane means staff confirmation is required.
          </p>
          <p className="mt-4 text-sm leading-6">
            A date already stored on a shipment is shown on <Link href="/track">tracking</Link>, not here.
          </p>
        </div>
        <EstimateForm />
      </section>
    </PublicFrame>
  );
}
