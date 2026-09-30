"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/client-api";
import { BRAND, SUPPORT_EMAIL } from "@/lib/constants";
import { formatWhen } from "@/lib/format";
import { deliveryRecord, isImage, isVideo, proofGroups, type ProofEvent, type ProofFile } from "@/lib/proof";
import { EvidenceTimeline } from "./evidence-timeline";
import { BrandLockup } from "./brand-mark";
import { StatusPill } from "./status-pill";

type ProofShipment = {
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
  recipientName: string;
  actualDeliveryDate: string | null;
  isDemo: boolean;
  courier: { name: string; vehicle: string; isDemo: boolean } | null;
  events: ProofEvent[];
  evidence: ProofFile[];
};

type ApiEvidence = Omit<ProofFile, "key" | "href"> & { token: string };
type ApiShipment = Omit<ProofShipment, "evidence"> & { evidence: ApiEvidence[] };

function place(city: string, country: string) {
  return [city, country].filter(Boolean).join(", ") || "Not recorded";
}

export function ProofLookup({ initialNumber = "" }: { initialNumber?: string }) {
  const router = useRouter();
  const [number, setNumber] = useState(initialNumber);
  const [result, setResult] = useState<ProofShipment | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function lookup(value: string) {
    const trackingNumber = value.trim().toUpperCase();
    if (!trackingNumber) return;
    setPending(true);
    setError("");
    try {
      const data = await api<{ shipment: ApiShipment }>(`/api/tracking?number=${encodeURIComponent(trackingNumber)}`);
      setResult({
        ...data.shipment,
        evidence: data.shipment.evidence.map((item) => ({
          ...item,
          key: item.token,
          href: `/api/evidence/${item.token}`,
        })),
      });
    } catch (caught) {
      setResult(null);
      setError(caught instanceof ApiError ? caught.message : "The proof record is unavailable right now.");
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
        className="card no-print grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const next = number.trim().toUpperCase();
          router.replace(next ? `/proof?number=${encodeURIComponent(next)}` : "/proof");
          void lookup(next);
        }}
      >
        <label className="field">
          <span>Tracking number</span>
          <input value={number} onChange={(event) => setNumber(event.target.value.toUpperCase())} placeholder="NKD-YYYYMMDD-XXXX" autoComplete="off" spellCheck={false} />
        </label>
        <button className="btn btn-copper" disabled={pending} type="submit">
          {pending ? "Opening…" : "Open proof"}
        </button>
      </form>
      {error ? <p className="rounded-xl border border-[#8a4a32] bg-[#2a1814] px-4 py-3 text-sm text-[#ffd0c2]">{error}</p> : null}
      {result ? <ProofDossier shipment={result} /> : null}
    </div>
  );
}

export function ProofDossier({ shipment }: { shipment: ProofShipment }) {
  const files = shipment.evidence;
  const groups = proofGroups(files);
  const delivery = deliveryRecord(shipment.status, shipment.actualDeliveryDate, shipment.events);
  const code = encodeURIComponent(shipment.trackingNumber);
  const driverStamp = groups.driverVideo.find((file) => file.capturedAt)?.capturedAt ?? null;

  return (
    <article className="proof-sheet grid gap-5">
      <header className="card overflow-hidden p-0">
        <div className="flex flex-wrap items-end justify-between gap-4 bg-[#071422] px-5 py-5 text-white">
          <div>
            <BrandLockup tone="gold" />
            <h2 className="serif mt-2 text-4xl">{delivery.confirmed ? "Proof of delivery" : "Shipment receipt"}</h2>
            <p className="mt-2 font-semibold tracking-wide">{shipment.trackingNumber}</p>
          </div>
          <StatusPill status={shipment.status} />
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_220px]">
          <div>
            {shipment.isDemo ? <p className="mb-3 text-sm text-[#ffd0c2]">TEST / DEMO. This is not a customer shipment.</p> : null}
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              {delivery.confirmed
                ? "The lines below are the delivery record staff stored. Blank lines were not filled in."
                : "Delivery has not been recorded on this file. The receipt still shows the tracking number and any proof staff have released."}
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Fact label="Recipient" value={shipment.recipientName || "Not recorded"} />
              <Fact label="Delivery time" value={delivery.at ? formatWhen(delivery.at, true) : "Not recorded"} />
              <Fact label="Delivery place" value={delivery.location || "Not recorded"} />
              <Fact label="From" value={place(shipment.origin.city, shipment.origin.country)} />
              <Fact label="To" value={place(shipment.destination.city, shipment.destination.country)} />
              <Fact label="Service" value={`${shipment.serviceType} · ${shipment.shipmentType}`} />
              <Fact label="Packages" value={String(shipment.packageCount)} />
              <Fact label="Weight" value={shipment.weight == null ? "Not recorded" : `${shipment.weight} ${shipment.weightUnit}`} />
            </dl>
          </div>
          <div className="grid content-start justify-items-center gap-3 rounded-2xl bg-white p-3 text-[#10263c]">
            <img src={`/api/tracking/code?number=${code}&kind=qr`} alt={`QR code for ${shipment.trackingNumber}`} className="h-36 w-36" />
            <img src={`/api/tracking/code?number=${code}&kind=barcode`} alt="" className="h-14 w-full" />
            <p className="text-center text-[0.7rem] tracking-wide">{shipment.trackingNumber}</p>
          </div>
        </div>
        <div className="no-print flex flex-wrap gap-3 px-5 pb-5">
          <a className="btn btn-copper" href={`/api/tracking/proof?number=${code}`}>
            Download certificate
          </a>
          <button className="btn btn-ghost" type="button" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </header>

      <section className="card p-5">
        <h3 className="serif text-3xl">Driver and vehicle</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Shown only when a courier is assigned or a public driver video is stored. This is not a live camera.
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <Fact label="Driver" value={shipment.courier ? `${shipment.courier.name}${shipment.courier.isDemo ? " · DEMO" : ""}` : "Not assigned"} />
          <Fact label="Vehicle" value={shipment.courier?.vehicle || "Not recorded"} />
          <Fact label="Video time" value={driverStamp ? formatWhen(driverStamp, true) : "Not recorded"} />
        </dl>
        {groups.driverVideo.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-8 text-sm leading-6 text-[var(--color-muted)]">
            No driver video has been released. Staff can upload a public MP4 or WEBM of the assigned driver. A video is not generated for this shipment.
          </p>
        ) : (
          <div className="mt-4 grid gap-4">
            {groups.driverVideo.map((file) => (
              <figure key={file.key} className="grid gap-2">
                {isVideo(file.fileType) ? (
                  <video className="max-h-[28rem] w-full rounded-2xl bg-black" controls preload="metadata" src={file.href} />
                ) : (
                  <FileLink file={file} />
                )}
                <figcaption className="text-sm text-[var(--color-muted)]">
                  {file.title}
                  {file.capturedAt ? ` · ${formatWhen(file.capturedAt, true)}` : ""}
                  {file.location ? ` · ${file.location}` : ""}
                  {file.isDemo ? " · DEMO" : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <PhotoLane title="Parcel before delivery" files={groups.before} empty="No before-delivery photo has been released." />
        <PhotoLane title="Parcel after delivery" files={groups.after} empty="No after-delivery photo has been released." />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <FileLane title="Pickup evidence" files={groups.pickup} empty="No pickup file has been released." />
        <FileLane title="Delivery evidence" files={groups.delivery} empty="No delivery file has been released." />
      </div>

      <section className="card p-5">
        <h3 className="serif text-3xl">Signature</h3>
        {groups.signature.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">No signature file has been released. A signature is not drawn for this shipment.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {groups.signature.map((file) => (
              <figure key={file.key} className="rounded-2xl border border-[var(--color-line)] bg-white p-3 text-[#10263c]">
                {isImage(file.fileType) ? <img src={file.href} alt="" className="max-h-48 w-full object-contain" /> : <FileLink file={file} />}
                <figcaption className="mt-2 text-sm">
                  {file.title}
                  {file.capturedAt ? ` · ${formatWhen(file.capturedAt, true)}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <FileLane title="Receipt and papers" files={groups.receipt} empty="No receipt or waybill has been released. The downloadable certificate is the branded record of what is stored." />
      <EvidenceTimeline events={shipment.events} files={files} />
      <p className="text-xs leading-5 text-[var(--color-muted)]">
        {BRAND.legal}. Questions: {SUPPORT_EMAIL}. Mail is not sent automatically. Locations are recorded events, not live GPS.
      </p>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

function PhotoLane({ title, files, empty }: { title: string; files: ProofFile[]; empty: string }) {
  return (
    <section className="card p-5">
      <h3 className="serif text-3xl">{title}</h3>
      {files.length === 0 ? <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{empty}</p> : null}
      <div className="mt-4 grid gap-3">
        {files.map((file) => (
          <figure key={file.key}>
            <img src={file.href} alt="" className="max-h-72 w-full rounded-2xl object-cover" />
            <figcaption className="mt-2 text-sm text-[var(--color-muted)]">
              {file.title}
              {file.evidenceType ? ` · ${file.evidenceType}` : ""}
              {file.capturedAt ? ` · ${formatWhen(file.capturedAt, true)}` : ""}
              {file.location ? ` · ${file.location}` : ""}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function FileLane({ title, files, empty }: { title: string; files: ProofFile[]; empty: string }) {
  return (
    <section className="card p-5">
      <h3 className="serif text-3xl">{title}</h3>
      {files.length === 0 ? <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{empty}</p> : null}
      <ul className="mt-4 grid gap-3">
        {files.map((file) => (
          <li key={file.key}>
            {isImage(file.fileType) ? <img src={file.href} alt="" className="mb-2 max-h-56 w-full rounded-2xl object-cover" /> : null}
            {isVideo(file.fileType) ? <video className="mb-2 max-h-72 w-full rounded-2xl bg-black" controls preload="metadata" src={file.href} /> : null}
            <FileLink file={file} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function FileLink({ file }: { file: ProofFile }) {
  return (
    <p className="text-sm">
      <a href={file.href}>{file.title}</a>
      <span className="text-[var(--color-muted)]">
        {" "}
        · {file.evidenceType}
        {file.capturedAt ? ` · ${formatWhen(file.capturedAt, true)}` : ""}
        {file.location ? ` · ${file.location}` : ""}
        {file.isDemo ? " · DEMO" : ""}
      </span>
    </p>
  );
}
