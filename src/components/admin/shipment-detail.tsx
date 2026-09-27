"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can, EVIDENCE_TYPES, STATUSES, STATUS_LABEL } from "@/lib/constants";
import { formatBytes, formatWhen } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import { AdminFrame, useStaff } from "./shell";
import { FacilityField, ShipmentForm } from "./shipment-form";
import type { EvidenceItem, Facility, Shipment, ShipmentEvent } from "./types";
import { Banner, localInputNow, toIso } from "./ui";

type Detail = {
  shipment: Shipment;
  events: ShipmentEvent[];
  evidence: EvidenceItem[];
  currentFacility: { name: string; city: string; country: string; isDemo: boolean } | null;
};

export function ShipmentDetail({ id }: { id: string }) {
  return (
    <AdminFrame>
      <DetailBody id={id} />
    </AdminFrame>
  );
}

function DetailBody({ id }: { id: string }) {
  const session = useStaff();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function reload() {
    const [next, facilityList] = await Promise.all([
      api<Detail>(`/api/admin/shipments/${id}`),
      api<{ items: Facility[] }>("/api/admin/facilities"),
    ]);
    setDetail(next);
    setFacilities(facilityList.items);
  }

  useEffect(() => {
    let cancel = false;
    Promise.all([api<Detail>(`/api/admin/shipments/${id}`), api<{ items: Facility[] }>("/api/admin/facilities")])
      .then(([next, facilityList]) => {
        if (cancel) return;
        setDetail(next);
        setFacilities(facilityList.items);
      })
      .catch((caught) => {
        if (!cancel) setError(caught instanceof ApiError ? caught.message : "This shipment could not be opened.");
      });
    return () => {
      cancel = true;
    };
  }, [id]);

  if (error && !detail) return <Banner>{error}</Banner>;
  if (!detail) return <p className="text-sm text-[var(--color-muted)]">Opening the shipment…</p>;

  const { shipment } = detail;
  const write = can(session.user.role, "shipments:write");
  const events = can(session.user.role, "events:write");
  const evidenceWrite = can(session.user.role, "evidence:write");
  const archive = can(session.user.role, "shipments:archive");

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/shipments" className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)] no-underline">
            Shipments
          </Link>
          <h1 className="serif mt-2 text-4xl">{shipment.trackingNumber}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={shipment.status} />
            {shipment.isDemo ? <span className="badge badge-warn">DEMO/TEST</span> : null}
            {shipment.archivedAt ? <span className="badge badge-muted">Archived</span> : null}
            <Link className="text-sm" href={`/track?number=${encodeURIComponent(shipment.trackingNumber)}`}>
              Public tracking
            </Link>
          </div>
        </div>
        {archive ? (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={async () => {
              setError("");
              try {
                await api(`/api/admin/shipments/${id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ archived: !shipment.archivedAt }),
                });
                setNotice(shipment.archivedAt ? "Shipment restored." : "Shipment archived.");
                await reload();
              } catch (caught) {
                setError(caught instanceof ApiError ? caught.message : "The archive state could not be changed.");
              }
            }}
          >
            {shipment.archivedAt ? "Restore" : "Archive"}
          </button>
        ) : null}
      </header>
      {shipment.isDemo ? <Banner>This is demonstration data. It is not a customer shipment.</Banner> : null}
      {notice ? <Banner tone="ok">{notice}</Banner> : null}
      {error ? <Banner>{error}</Banner> : null}
      <section className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center">
        <img src={`/api/admin/shipments/${id}/qr`} alt="" className="h-36 w-36 rounded-2xl bg-white p-3" />
        <div>
          <img src={`/api/admin/shipments/${id}/barcode`} alt="" className="h-16 max-w-sm" />
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {shipment.senderName} → {shipment.recipientName}
            {detail.currentFacility ? ` · Now at ${detail.currentFacility.name}` : ""}
            {detail.currentFacility?.isDemo ? " (DEMO facility)" : ""}
          </p>
          <button
            className="btn btn-ghost mt-3"
            type="button"
            onClick={() => navigator.clipboard.writeText(shipment.trackingNumber)}
          >
            Copy tracking number
          </button>
        </div>
      </section>
      {write ? (
        <ShipmentForm
          shipment={shipment}
          facilities={facilities}
          submitLabel="Save shipment"
          onSubmit={async (payload) => {
            await api(`/api/admin/shipments/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
            setNotice("Shipment saved. Status changes still belong in the event log.");
            await reload();
          }}
        />
      ) : (
        <ReadOnly shipment={shipment} viewer={session.user.role === "viewer"} />
      )}
      <section className="card p-5">
        <h2 className="serif text-3xl">Tracking events</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Events are kept. They are not edited or deleted. Adding one updates the shipment status.</p>
        <ol className="mt-5 grid gap-4 border-l border-[var(--color-line)] pl-4">
          {detail.events.map((event) => (
            <li key={event.id}>
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">{formatWhen(event.eventTime, true)}</p>
              <p className="font-semibold">
                {event.title} · {event.statusLabel || STATUS_LABEL[event.status as keyof typeof STATUS_LABEL] || event.status}
              </p>
              {event.description ? <p className="text-sm leading-6">{event.description}</p> : null}
              <p className="text-sm text-[var(--color-muted)]">
                {[event.location, event.facilityName, event.createdByName].filter(Boolean).join(" · ")}
              </p>
            </li>
          ))}
        </ol>
        {events ? (
          <EventForm
            facilities={facilities}
            onSubmit={async (payload) => {
              await api(`/api/admin/shipments/${id}/events`, { method: "POST", body: JSON.stringify(payload) });
              setNotice("Event recorded.");
              await reload();
            }}
          />
        ) : null}
      </section>
      <section className="card p-5">
        <h2 className="serif text-3xl">Evidence</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">JPG, PNG, WEBP up to 10 MB. PDF up to 20 MB. Files stay private until an admin marks them public.</p>
        <div className="mt-4 grid gap-4">
          {detail.evidence.map((item) => (
            <EvidenceRow
              key={item.id}
              item={item}
              canToggle={can(session.user.role, "evidence:visibility")}
              canDelete={can(session.user.role, "evidence:delete")}
              onChange={async () => {
                setNotice("Evidence updated.");
                await reload();
              }}
              onError={setError}
            />
          ))}
          {detail.evidence.length === 0 ? <p className="text-sm text-[var(--color-muted)]">No files on this shipment.</p> : null}
        </div>
        {evidenceWrite ? (
          <UploadForm
            shipment={shipment}
            facilities={facilities}
            events={detail.events}
            onDone={async () => {
              setNotice("Evidence stored.");
              await reload();
            }}
          />
        ) : null}
      </section>
    </div>
  );
}

function ReadOnly({ shipment, viewer }: { shipment: Shipment; viewer: boolean }) {
  const rows = [
    ["Service", shipment.serviceLabel],
    ["Type", shipment.shipmentTypeLabel],
    ["Sender", [shipment.senderName, shipment.senderCity, shipment.senderCountry].filter(Boolean).join(", ")],
    ["Recipient", [shipment.recipientName, shipment.recipientCity, shipment.recipientCountry].filter(Boolean).join(", ")],
    ["Packages", String(shipment.packageCount)],
    ["Weight", shipment.weight ? `${shipment.weight} ${shipment.weightUnit}` : "—"],
    ["Public description", shipment.publicDescription || "—"],
  ];
  return (
    <section className="card grid gap-3 p-5 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <p key={label}>
          <span className="block text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">{label}</span>
          {value}
        </p>
      ))}
      <p className="sm:col-span-2 text-sm text-[var(--color-muted)]">
        {viewer ? "Internal notes are hidden for the viewer role." : shipment.internalNotes || "No internal notes."}
      </p>
    </section>
  );
}

function EventForm({
  facilities,
  onSubmit,
}: {
  facilities: Facility[];
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      await onSubmit({
        status: form.get("status"),
        title: form.get("title"),
        description: form.get("description") ?? "",
        location: form.get("location") ?? "",
        facilityId: form.get("facilityId") || null,
        eventTime: toIso(String(form.get("eventTime") ?? "")),
      });
      event.currentTarget.reset();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The event could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 grid gap-3 border-t border-[var(--color-line)] pt-5" onSubmit={handle}>
      <h3 className="font-semibold">Add an event</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue="in_transit">
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>When</span>
          <input name="eventTime" type="datetime-local" required defaultValue={localInputNow()} />
        </label>
        <label className="field sm:col-span-2">
          <span>Title</span>
          <input name="title" required maxLength={160} />
        </label>
        <label className="field">
          <span>Location</span>
          <input name="location" maxLength={200} />
        </label>
        <FacilityField name="facilityId" label="Facility" facilities={facilities} />
        <label className="field sm:col-span-2">
          <span>Description</span>
          <textarea name="description" maxLength={2000} />
        </label>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      <button className="btn btn-copper w-fit" disabled={pending} type="submit">
        {pending ? "Recording…" : "Record event"}
      </button>
    </form>
  );
}

function EvidenceRow({
  item,
  canToggle,
  canDelete,
  onChange,
  onError,
}: {
  item: EvidenceItem;
  canToggle: boolean;
  canDelete: boolean;
  onChange: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const image = item.fileType.startsWith("image/");
  return (
    <article className="grid gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-3 sm:grid-cols-[120px_1fr]">
      {image ? (
        <img src={`/api/admin/evidence/${item.id}/file`} alt="" className="h-28 w-full rounded-xl object-cover" />
      ) : (
        <a className="btn btn-ghost h-fit" href={`/api/admin/evidence/${item.id}/file`}>
          Open PDF
        </a>
      )}
      <div>
        <p className="font-semibold">
          {item.title} {item.isDemo ? <span className="badge badge-warn">DEMO</span> : null}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {item.evidenceType} · {formatBytes(item.fileSize)} · {item.isPublic ? "Public" : "Private"} · {formatWhen(item.createdAt, true)}
        </p>
        {item.description ? <p className="mt-1 text-sm">{item.description}</p> : null}
        <div className="mt-2 flex flex-wrap gap-2">
          {image ? (
            <a className="text-sm" href={`/api/admin/evidence/${item.id}/file`}>
              Open file
            </a>
          ) : null}
          {item.isPublic ? (
            <a className="text-sm" href={`/api/evidence/${item.publicToken}`}>
              Public link
            </a>
          ) : null}
          {canToggle ? (
            <button
              className="text-sm underline"
              type="button"
              onClick={async () => {
                try {
                  await api(`/api/admin/evidence/${item.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      evidenceType: item.evidenceType,
                      title: item.title,
                      description: item.description,
                      location: item.location,
                      facilityId: item.facilityId,
                      eventId: item.eventId,
                      capturedAt: item.capturedAt,
                      isPublic: !item.isPublic,
                      isDemo: item.isDemo,
                    }),
                  });
                  await onChange();
                } catch (caught) {
                  onError(caught instanceof ApiError ? caught.message : "Visibility could not be changed.");
                }
              }}
            >
              {item.isPublic ? "Make private" : "Show on tracking"}
            </button>
          ) : null}
          {canDelete ? (
            <button
              className="text-sm text-[#7a3e22] underline"
              type="button"
              onClick={async () => {
                if (!window.confirm("Delete this evidence file? This cannot be undone.")) return;
                try {
                  await api(`/api/admin/evidence/${item.id}`, { method: "DELETE" });
                  await onChange();
                } catch (caught) {
                  onError(caught instanceof ApiError ? caught.message : "The file could not be deleted.");
                }
              }}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function UploadForm({
  shipment,
  facilities,
  events,
  onDone,
}: {
  shipment: Shipment;
  facilities: Facility[];
  events: ShipmentEvent[];
  onDone: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("shipmentId", shipment.id);
    form.set("isPublic", form.get("isPublic") === "on" ? "true" : "false");
    form.set("isDemo", shipment.isDemo ? "true" : "false");
    const captured = String(form.get("capturedAt") ?? "");
    if (captured) form.set("capturedAt", toIso(captured) ?? "");
    setPending(true);
    setError("");
    try {
      await api("/api/admin/evidence", { method: "POST", body: form });
      event.currentTarget.reset();
      await onDone();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The upload failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 grid gap-3 border-t border-[var(--color-line)] pt-5" onSubmit={handle}>
      <h3 className="font-semibold">Upload proof</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field sm:col-span-2">
          <span>Files</span>
          <input name="files" type="file" required multiple accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf" />
        </label>
        <label className="field">
          <span>Type</span>
          <select name="evidenceType" defaultValue="Package">
            {EVIDENCE_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Title</span>
          <input name="title" required maxLength={160} />
        </label>
        <label className="field">
          <span>Location</span>
          <input name="location" maxLength={200} />
        </label>
        <label className="field">
          <span>Captured</span>
          <input name="capturedAt" type="datetime-local" />
        </label>
        <FacilityField name="facilityId" label="Facility" facilities={facilities} />
        <label className="field">
          <span>Linked event</span>
          <select name="eventId" defaultValue="">
            <option value="">None</option>
            {events.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field sm:col-span-2">
          <span>Description</span>
          <textarea name="description" maxLength={2000} />
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input className="mt-1" name="isPublic" type="checkbox" />
        <span>Show this file on the public tracking page. Leave it off for internal proof.</span>
      </label>
      {error ? <Banner>{error}</Banner> : null}
      <button className="btn btn-primary w-fit" disabled={pending} type="submit">
        {pending ? "Uploading…" : "Store evidence"}
      </button>
    </form>
  );
}
