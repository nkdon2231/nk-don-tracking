"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/client-api";
import { BRAND, DOCUMENT_EVIDENCE, HAPPY_PATH } from "@/lib/constants";
import { formatWhen } from "@/lib/format";
import { journeyMarkers, type EvidenceStageId } from "@/lib/stages";
import type { RecordedRoute } from "@/lib/route";
import { EvidenceBoard } from "./logistics/evidence-board";
import { CustomsPanel, DeliveryPanel } from "./logistics/movement-panels";
import { RecordedRoute as RecordedRouteView } from "./logistics/recorded-route";
import { ShipmentJourney } from "./logistics/shipment-journey";
import { EvidenceTimeline } from "./evidence-timeline";
import { ProofDossier } from "./proof-dossier";
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
  recipientName: string;
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

const RECENT_KEY = "nkdon.recentTracking";

function readRecent() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function TrackPanel({ initialNumber = "" }: { initialNumber?: string }) {
  const router = useRouter();
  const [number, setNumber] = useState(initialNumber);
  const [result, setResult] = useState<Tracking | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [stage, setStage] = useState<EvidenceStageId>("all");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  async function lookup(value: string) {
    const trackingNumber = value.trim().toUpperCase();
    if (!trackingNumber) return;
    setPending(true);
    setError("");
    setStage("all");
    try {
      const data = await api<{ shipment: Tracking }>(`/api/tracking?number=${encodeURIComponent(trackingNumber)}`);
      setResult(data.shipment);
      const next = [data.shipment.trackingNumber, ...readRecent().filter((item) => item !== data.shipment.trackingNumber)].slice(0, 8);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecent(next);
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
      {recent.length ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[var(--color-muted)]">On this browser only. Not an account.</span>
          {recent.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-full border border-[var(--color-line)] px-3 py-1"
              onClick={() => {
                setNumber(item);
                router.replace(`/track?number=${encodeURIComponent(item)}`);
                void lookup(item);
              }}
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            className="text-[var(--color-muted)]"
            onClick={() => {
              window.localStorage.removeItem(RECENT_KEY);
              setRecent([]);
            }}
          >
            Clear
          </button>
        </div>
      ) : null}
      {!result && !error && !pending ? (
        <p className="text-sm text-[var(--color-muted)]">Use the number issued by {BRAND.short}. It looks like NKD-YYYYMMDD-XXXX.</p>
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
  const [section, setSection] = useState("overview");
  useEffect(() => {
    setSection("overview");
  }, [result.trackingNumber]);

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
  const documentTypes = new Set<string>(DOCUMENT_EVIDENCE);
  const documents = files.filter((file) => documentTypes.has(file.evidenceType));
  const hasCustoms =
    result.status === "customs_clearance" ||
    result.events.some((event) => event.status === "customs_clearance") ||
    files.some((file) => file.evidenceType === "Customs" || file.evidenceType === "Clearance");
  const hasDelivery =
    result.status === "out_for_delivery" ||
    result.status === "delivered" ||
    Boolean(result.actualDeliveryDate) ||
    files.some((file) => file.evidenceType === "Delivery" || file.evidenceType === "Signature");
  const sections = [
    { id: "overview", label: "Overview", show: true },
    { id: "proof", label: "Proof", show: true },
    { id: "timeline", label: "Timeline", show: result.events.length > 0 },
    { id: "map", label: "Map", show: (result.route?.points.length ?? 0) > 0 },
    { id: "evidence", label: "Evidence", show: files.length > 0 },
    { id: "documents", label: "Documents", show: documents.length > 0 },
    { id: "courier", label: "Courier", show: Boolean(result.courier) },
    { id: "customs", label: "Customs", show: hasCustoms },
    { id: "delivery", label: "Delivery", show: hasDelivery },
  ].filter((item) => item.show);
  const active = sections.some((item) => item.id === section) ? section : "overview";
  const fileBrief = files.map((file) => ({ key: file.key, title: file.title, evidenceType: file.evidenceType, href: file.href }));

  return (
    <article className="grid min-w-0 gap-5">
      <header className="card p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">{BRAND.legal}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-copper)]">Tracking</p>
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
            <dd>{result.weight == null ? "Not published" : `${result.weight} ${result.weightUnit}`}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Dimensions</dt>
            <dd>{result.dimensions || "Not published"}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Estimated delivery</dt>
            <dd>{result.estimatedDeliveryDate ? formatWhen(result.estimatedDeliveryDate) : "Not set by staff"}</dd>
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
        <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
          Stages below light up only after an event is recorded. Locations are those events and facilities, not a live GPS feed.
        </p>
      </header>
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
      {result.status === "exception" || result.status === "cancelled" ? (
        <p className="rounded-xl border border-[#8a4a32] bg-[#2a1814] px-4 py-3 text-sm text-[#ffd0c2]">
          This shipment is {result.statusLabel.toLowerCase()}. It is off the usual path. The timeline is the record.
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
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Shipment sections">
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active === item.id}
            className={`inline-flex min-h-11 items-center rounded-full px-3 py-2 text-sm ${active === item.id ? "bg-[var(--color-copper)] text-[#1a1203]" : "border border-[var(--color-line)]"}`}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {active === "overview" ? (
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          Open Proof for the receipt, QR code, barcode, and only the photos or video staff released. Other sections stay hidden until that record exists.
        </p>
      ) : null}
      {active === "proof" ? (
        <ProofDossier
          shipment={{
            trackingNumber: result.trackingNumber,
            status: result.status,
            statusLabel: result.statusLabel,
            serviceType: result.serviceType,
            shipmentType: result.shipmentType,
            origin: result.origin,
            destination: result.destination,
            packageCount: result.packageCount,
            weight: result.weight,
            weightUnit: result.weightUnit,
            recipientName: result.recipientName,
            actualDeliveryDate: result.actualDeliveryDate,
            isDemo: result.isDemo,
            courier: result.courier,
            events: result.events,
            evidence: files,
          }}
        />
      ) : null}
      {active === "timeline" ? (
        <EvidenceTimeline events={result.events} files={files} title="Tracking timeline" />
      ) : null}
      {active === "map" ? <RecordedRouteView points={result.route?.points ?? []} /> : null}
      {active === "evidence" ? (
        <EvidenceBoard
          items={files}
          stage={stage}
          onStage={onStage}
          empty="No customer-visible files have been added for this stage."
        />
      ) : null}
      {active === "documents" ? (
        <section className="card p-5">
          <h3 className="serif text-2xl">Documents</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Public waybills, customs files, clearance papers, and signatures. PDFs open in a new tab. QCORVAZENT does not generate official forms.
          </p>
          <ul className="mt-4 grid gap-2 text-sm">
            {documents.map((file) => (
              <li key={file.key}>
                <a href={file.href} target="_blank" rel="noreferrer">
                  {file.title}
                </a>
                <span className="text-[var(--color-muted)]"> · {file.evidenceType}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {active === "courier" && result.courier ? (
        <section className="card p-5">
          <h3 className="serif text-2xl">Courier</h3>
          <p className="mt-3 text-sm">
            {result.courier.name}
            {result.courier.vehicle ? ` · ${result.courier.vehicle}` : ""}
            {result.courier.isDemo ? " · DEMO" : ""}
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Phone, notes, and photo stay with staff.</p>
        </section>
      ) : null}
      {active === "customs" ? <CustomsPanel events={result.events} files={fileBrief} /> : null}
      {active === "delivery" ? (
        <DeliveryPanel
          status={result.status}
          statusLabel={result.statusLabel}
          actualDeliveryDate={result.actualDeliveryDate}
          files={fileBrief}
        />
      ) : null}
    </article>
  );
}
