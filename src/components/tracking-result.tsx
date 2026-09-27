"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client";
import { formatDate, formatDateTime, place, statusTone } from "@/lib/format";

type PublicShipment = {
  trackingNumber: string;
  status: string;
  statusLabel: string;
  serviceType: string;
  shipmentType: string;
  origin: { city: string; country: string };
  destination: { city: string; country: string };
  publicDescription: string;
  estimatedDeliveryDate: string | null;
  isDemo: boolean;
  currentFacility: { name: string; city: string; country: string } | null;
  progress: { status: string; label: string; occurred: boolean; current: boolean }[];
  events: { title: string; statusLabel: string; description: string; location: string; eventTime: string | null; facility: { name: string } | null }[];
  evidence: { token: string; title: string; evidenceType: string; fileSize: number }[];
};

export function TrackingResult({ number }: { number: string }) {
  const [shipment, setShipment] = useState<PublicShipment | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<{ shipment: PublicShipment }>(`/api/tracking?number=${encodeURIComponent(number)}`)
      .then((payload) => {
        if (!cancelled) setShipment(payload.shipment);
      })
      .catch((err) => {
        if (!cancelled) {
          setShipment(null);
          setError(err instanceof ApiError ? err.message : "Tracking is temporarily unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [number]);

  if (loading) return <div className="mt-6 rounded-2xl border border-line bg-white p-8 text-center text-steel">Retrieving shipment {number}…</div>;
  if (error) return <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6 text-red-700">{error}</div>;
  if (!shipment) return null;

  return (
    <div className="mt-6 space-y-6">
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex flex-col gap-4 bg-ink p-6 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Tracking number</p>
            <h2 className="mt-1 font-mono text-2xl font-bold">{shipment.trackingNumber}</h2>
            {shipment.isDemo ? <p className="mt-2 text-xs text-gold">Demonstration record</p> : null}
          </div>
          <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusTone(shipment.status)}`}>{shipment.statusLabel}</span>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-3">
          <Fact label="Origin" value={place(shipment.origin.city, shipment.origin.country)} />
          <Fact label="Current location" value={shipment.currentFacility ? `${shipment.currentFacility.name} · ${place(shipment.currentFacility.city, shipment.currentFacility.country)}` : place(shipment.origin.city, shipment.origin.country)} />
          <Fact label="Destination" value={place(shipment.destination.city, shipment.destination.country)} />
          <Fact label="Service" value={shipment.serviceType} />
          <Fact label="Type" value={shipment.shipmentType} />
          <Fact label="Estimated delivery" value={formatDate(shipment.estimatedDeliveryDate)} />
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-6">
        <h3 className="text-lg font-semibold">Progress</h3>
        <ol className="mt-4 grid gap-2 sm:grid-cols-4">
          {shipment.progress.map((step) => (
            <li key={step.status} className={`rounded-xl px-3 py-3 text-xs font-semibold ${step.current ? "bg-ink text-white" : step.occurred ? "bg-emerald-50 text-emerald-900" : "bg-cream text-steel"}`}>
              {step.label}
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded-2xl border border-line bg-white p-6">
        <h3 className="text-lg font-semibold">Timeline</h3>
        <div className="mt-5 space-y-5">
          {shipment.events.map((event, index) => (
            <div key={`${event.eventTime}-${index}`} className="pb-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <p className="font-semibold">{event.title || event.statusLabel}</p>
                <p className="text-sm text-steel">{formatDateTime(event.eventTime)}</p>
              </div>
              {event.location ? <p className="text-sm text-steel">{event.location}</p> : null}
              {event.description ? <p className="mt-1 text-sm text-steel">{event.description}</p> : null}
            </div>
          ))}
        </div>
      </section>
      {shipment.evidence.length > 0 ? (
        <section className="rounded-2xl border border-line bg-white p-6">
          <h3 className="text-lg font-semibold">Published documents</h3>
          <ul className="mt-4 space-y-3">
            {shipment.evidence.map((item) => (
              <li key={item.token} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                <span>{item.title} · {item.evidenceType}</span>
                <a className="text-sm font-semibold underline" href={`/api/evidence/${item.token}`}>Open</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-steel">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
