import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/site";
import { SERVICE_TYPES } from "@/lib/constants";

export const metadata: Metadata = { title: "Services" };

const DETAIL: Record<string, string> = {
  express_courier: "Documents and parcels with documented pickup and delivery events.",
  international_freight: "Cross-border freight planning with facility checkpoints and customs status.",
  air_cargo: "Airport-to-airport movement with cargo evidence and handover records.",
  ground_transportation: "Domestic and inland haulage between warehouses, hubs, and delivery stations.",
  warehousing: "Secure storage, sortation, and release against consignment instructions.",
  pickup_delivery: "Scheduled collection and last-mile delivery windows.",
  customs_documentation: "Paperwork, inspection holds, and clearance events attached to the shipment file.",
  business_logistics: "Recurring commercial flows with named contacts and reference numbers.",
  consignment: "Ownership and release control for goods moving on account.",
  secure_tracking: "A single public tracking number backed by server-side events and evidence.",
};

export default function ServicesPage() {
  return (
    <PublicShell current="/services">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-steel">Services</p>
        <h1 className="mt-2 text-4xl font-semibold">Logistics services with an operations record behind them.</h1>
        <p className="mt-4 max-w-2xl text-steel">
          Every service type maps to the same shipment file used by tracking, evidence, and the operations desk.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {SERVICE_TYPES.map((service) => (
            <article key={service.value} className="rounded-2xl border border-line bg-white p-6">
              <h2 className="text-xl font-semibold">{service.label}</h2>
              <p className="mt-2 text-sm leading-6 text-steel">{DETAIL[service.value]}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex gap-3">
          <Link href="/book" className="rounded-xl bg-ink px-5 py-3 font-semibold text-white">
            Book a movement
          </Link>
          <Link href="/rates" className="rounded-xl border border-line px-5 py-3">
            Request rates
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
