"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/client-api";
import { HAPPY_PATH } from "@/lib/constants";
import { formatWhen } from "@/lib/format";
import { journeyMarkers, type EvidenceStageId } from "@/lib/stages";
import type { RecordedRoute } from "@/lib/route";
import { EvidenceBoard } from "./logistics/evidence-board";
import { CustomsPanel, DeliveryPanel } from "./logistics/movement-panels";
import { RecordedRoute as RecordedRouteView } from "./logistics/recorded-route";
import { ShipmentJourney } from "./logistics/shipment-journey";
import { StatusPill } from "./status-pill";

type TrackingEvent = {
  title: string;
  description: string;
  location: string;
  eventTime: string | null;
  status: string;
  statusLabel: string;
  latitude: number | null;
  longitude: number | null;
};

type TrackingEvidence = {
  token: string;
  title: string;
  description: string;
  evidenceType: string;
  fileType: string;
  fileSize: number;
  location: string;
  capturedAt: string | null;
  isDemo: boolean;
};

type Tracking = {
  trackingNumber: string;
  status: string;
  statusLabel: string;
  serviceType: string;
  serviceCode: string;
  shipmentType: string;
  origin: { city: string; country: string };
  destination: { city: string; country: string };
  packageCount: number;
  weight: number | null;
  weightUnit: string;
  dimensions: string;
  publicDescription: string;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  isDemo: boolean;
  liveGps: false;
  currentFacility: { name: string; city: string; country: string; isDemo: boolean } | null;
  courier: { name: string; vehicle: string; isDemo: boolean } | null;
  route: RecordedRoute;
  progress: { status: string; label: string; occurred: boolean; current: boolean }[];
  events: TrackingEvent[];
  evidence: TrackingEvidence[];
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
  const [stage, setStage] = useState<EvidenceStageId>("all");

  async function lookup(value: string) {
    const trackingNumber = value.trim().toUpperCase();
    if (!trackingNumber) return;
    setPending(true);
    setError("");
    setStage("all");
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
      {error ? <p className="rounded-xl border border-[#8a4a32] bg-[#2a1814] px-4 py-3 text-sm text-[#ffd0c2]">{error}</p> : null}
      {!result && !error && !pending ? (
        <p className="text-sm text-[var(--color-muted)]">Use the number issued by NKDON. It looks like NKD-YYYYMMDD-XXXX.</p>
      ) : null}
      {pending && !result ? <p className="text-sm text-[var(--color-muted)]">Looking up the shipment…</p> : null}
      {result ? <TrackingResult result={result} stage={stage} onStage={setStage} /> : null}
    </div>
  );
}

function TrackingResult({
  result,
  stage,
  onStage,
}: {
  result: Tracking;
  stage: EvidenceStageId;
  onStage: (stage: EvidenceStageId) => void;
}) {
  const files = result.evidence.map((item) => ({
    key: item.token,
    href: `/api/evidence/${item.token}`,
    title: item.title,
    evidenceType: item.evidenceType,
    fileType: item.fileType,
    fileSize: item.fileSize,
    capturedAt: item.capturedAt,
    location: item.location,
    description: item.description,
    isDemo: item.isDemo,
    visibility: "Customer-visible",
  }));
  return (
    <article className="grid min-w-0 gap-5">
      <header className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">Shipment</p>
            <h2 className="serif text-3xl">{result.trackingNumber}</h2>
          </div>
          <StatusPill status={result.status} />
        </div>
        {result.isDemo ? <p className="mt-3 text-sm text-[#ffd0c2]">TEST / DEMO. This is not a customer shipment.</p> : null}
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
            <dt className="text-[var(--color-muted)]">Dimensions</dt>
            <dd>{result.dimensions || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Estimated delivery</dt>
            <dd>{formatWhen(result.estimatedDeliveryDate)}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Delivered</dt>
            <dd>{formatWhen(result.actualDeliveryDate)}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Courier</dt>
            <dd>
              {result.courier
                ? `${result.courier.name}${result.courier.vehicle ? ` · ${result.courier.vehicle}` : ""}${result.courier.isDemo ? " · DEMO" : ""}`
                : "Not assigned"}
            </dd>
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
        <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">Position on this page is taken from recorded events and facilities. NKDON is not showing a live GPS feed.</p>
      </header>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <ShipmentJourney
          status={result.status}
          serviceType={result.serviceCode || result.serviceType}
          markers={journeyMarkers(
            result.status,
            result.events.map((event) => event.status),
          )}
          points={result.route?.points ?? []}
          stage={stage}
          onStage={onStage}
        />
        <RecordedRouteView points={result.route?.points ?? []} />
      </div>
      {result.status === "exception" || result.status === "cancelled" ? (
        <p className="rounded-xl border border-[#8a4a32] bg-[#2a1814] px-4 py-3 text-sm text-[#ffd0c2]">
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
                    ? "border-[var(--color-copper)] bg-[color:rgba(255,183,3,0.14)]"
                    : step.occurred
                      ? "border-[var(--color-lane)] bg-[color:rgba(62,198,192,0.12)]"
                      : "border-[var(--color-line)] text-[var(--color-muted)]"
                }`}
              >
                {step.label}
              </li>
            ))}
        </ol>
      )}
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <CustomsPanel
          events={result.events}
          files={files.map((file) => ({ key: file.key, title: file.title, evidenceType: file.evidenceType, href: file.href }))}
        />
        <DeliveryPanel
          status={result.status}
          statusLabel={result.statusLabel}
          actualDeliveryDate={result.actualDeliveryDate}
          files={files.map((file) => ({ key: file.key, title: file.title, evidenceType: file.evidenceType, href: file.href }))}
        />
      </div>
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
              {event.latitude != null && event.longitude != null ? (
                <p className="text-xs text-[var(--color-muted)]">A recorded coordinate is plotted on the route. It is not a live position.</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
      <EvidenceBoard
        items={files}
        stage={stage}
        onStage={onStage}
        empty={result.evidence.length === 0 ? "No customer-visible files have been added." : "No customer-visible files have been added for this stage."}
      />
    </article>
  );
}
