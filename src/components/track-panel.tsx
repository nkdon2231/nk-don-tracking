"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/client-api";
import { HAPPY_PATH } from "@/lib/constants";
import { formatBytes, formatWhen } from "@/lib/format";
import { StatusPill } from "./status-pill";

type Tracking = {
  trackingNumber: string;
  status: string;
  statusLabel: string;
  serviceType: string;
  shipmentType: string;
  origin: { city: string; country: string };
  destination: { city: string; country: string };
  packageCount: number;
  weight: number | null;
  weightUnit: string;
  publicDescription: string;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  isDemo: boolean;
  currentFacility: { name: string; city: string; country: string; isDemo: boolean } | null;
  progress: { status: string; label: string; occurred: boolean; current: boolean }[];
  events: { title: string; description: string; location: string; eventTime: string; status: string }[];
  evidence: { token: string; title: string; evidenceType: string; fileType: string; fileSize: number; capturedAt: string | null; isDemo: boolean }[];
};

function place(city: string, country: string) {
  return [city, country].filter(Boolean).join(", ") || "Not published";
}

export function TrackPanel({ initialNumber = "" }: { initialNumber?: string }) {
  const router = useRouter();
  const [number, setNumber] = useState(initialNumber);
  const [result, setResult] = useState<Tracking | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function lookup(value: string) {
    const trackingNumber = value.trim().toUpperCase();
    if (!trackingNumber) return;
    setPending(true);
    setError("");
    try {
      const data = await api<{ shipment: Tracking }>(`/api/tracking?number=${encodeURIComponent(trackingNumber)}`);
      setResult(data.shipment);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof ApiError ? caught.message : "Tracking is unavailable right now.");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (initialNumber) void lookup(initialNumber);
    // Lookup once for the URL that opened this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNumber]);

  return (
    <div className="grid gap-6">
      <form
        className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const next = number.trim().toUpperCase();
          router.replace(next ? `/track?number=${encodeURIComponent(next)}` : "/track");
          void lookup(next);
        }}
      >
        <label className="field">
          <span>Tracking number</span>
          <input
            value={number}
            onChange={(event) => setNumber(event.target.value.toUpperCase())}
            placeholder="NKD-YYYYMMDD-XXXX"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button className="btn btn-copper" disabled={pending} type="submit">
          {pending ? "Looking up…" : "Track shipment"}
        </button>
      </form>
      {error ? <p className="rounded-xl bg-[#f8e7dc] px-4 py-3 text-sm text-[#7a3e22]">{error}</p> : null}
      {!result && !error && !pending ? (
        <p className="text-sm text-[var(--color-muted)]">Use the number issued by NKDON. It looks like NKD-YYYYMMDD-XXXX.</p>
      ) : null}
      {result ? (
        <article className="grid gap-5">
          <header className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">Shipment</p>
                <h2 className="serif text-3xl">{result.trackingNumber}</h2>
              </div>
              <StatusPill status={result.status} />
            </div>
            {result.isDemo ? (
              <p className="mt-3 text-sm text-[#7a3e22]">TEST / DEMO. This is not a customer shipment.</p>
            ) : null}
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-[var(--color-muted)]">Service</dt>
                <dd>{result.serviceType}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Type</dt>
                <dd>{result.shipmentType}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">From</dt>
                <dd>{place(result.origin.city, result.origin.country)}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">To</dt>
                <dd>{place(result.destination.city, result.destination.country)}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Packages</dt>
                <dd>{result.packageCount}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Weight</dt>
                <dd>{result.weight == null ? "—" : `${result.weight} ${result.weightUnit}`}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Estimated delivery</dt>
                <dd>{formatWhen(result.estimatedDeliveryDate)}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Delivered</dt>
                <dd>{formatWhen(result.actualDeliveryDate)}</dd>
              </div>
            </dl>
            {result.publicDescription ? <p className="mt-4 text-sm leading-6">{result.publicDescription}</p> : null}
            {result.currentFacility ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Last published facility: {result.currentFacility.name}
                {result.currentFacility.isDemo ? " (demonstration)" : ""}
                {place(result.currentFacility.city, result.currentFacility.country) !== "Not published"
                  ? ` · ${place(result.currentFacility.city, result.currentFacility.country)}`
                  : ""}
              </p>
            ) : null}
          </header>
          {result.status === "exception" || result.status === "cancelled" ? (
            <p className="rounded-xl bg-[#f8e7dc] px-4 py-3 text-sm text-[#7a3e22]">
              This shipment is {result.statusLabel.toLowerCase()}. It is off the usual path. The events below are the record.
            </p>
          ) : (
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {result.progress
                .filter((step) => HAPPY_PATH.includes(step.status as (typeof HAPPY_PATH)[number]))
                .map((step) => (
                  <li
                    key={step.status}
                    className={`rounded-xl border px-2 py-3 text-center text-[0.7rem] leading-4 ${
                      step.current
                        ? "border-[var(--color-copper)] bg-white"
                        : step.occurred
                          ? "border-[var(--color-pine)] bg-[#e7f0eb]"
                          : "border-[var(--color-line)] text-[var(--color-muted)]"
                    }`}
                  >
                    {step.label}
                  </li>
                ))}
            </ol>
          )}
          <section className="card p-5">
            <h3 className="serif text-2xl">Movement</h3>
            <ol className="mt-4 grid gap-4">
              {result.events.length === 0 ? <li className="text-sm text-[var(--color-muted)]">No public events yet.</li> : null}
              {result.events.map((event) => (
                <li key={`${event.eventTime}-${event.title}`} className="border-l-2 border-[var(--color-copper)] pl-4">
                  <p className="text-xs text-[var(--color-muted)]">{formatWhen(event.eventTime, true)}</p>
                  <p className="font-semibold">{event.title}</p>
                  {event.location ? <p className="text-sm">{event.location}</p> : null}
                  {event.description ? <p className="text-sm text-[var(--color-muted)]">{event.description}</p> : null}
                </li>
              ))}
            </ol>
          </section>
          {result.evidence.length ? (
            <section className="card p-5">
              <h3 className="serif text-2xl">Documents and photos</h3>
              <ul className="mt-4 grid gap-3">
                {result.evidence.map((item) => (
                  <li key={item.token} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-[var(--color-muted)]">
                        {item.evidenceType} · {formatBytes(item.fileSize)}
                        {item.isDemo ? " · demonstration" : ""}
                      </p>
                    </div>
                    <a className="btn btn-ghost !py-1.5 text-sm" href={`/api/evidence/${item.token}`}>
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
