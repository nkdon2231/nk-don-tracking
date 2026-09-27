"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client";
import { ShipmentForm } from "@/components/admin/shipment-form";
import { EVIDENCE_TYPES, STATUSES } from "@/lib/constants";
import { formatDateTime, statusLabel } from "@/lib/format";

type Detail = {
  shipment: Record<string, string | number | boolean | null> & { id: string; trackingNumber: string; archivedAt: string | null };
  events: { id: string; title: string; status: string; location: string; eventTime: string | null; description: string }[];
  evidence: { id: string; title: string; evidenceType: string; isPublic: boolean; fileSize: number }[];
};

export default function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setDetail(await api<Detail>(`/api/admin/shipments/${id}`));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [id]);

  async function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/admin/shipments/${id}/events`, {
        method: "POST",
        body: JSON.stringify({
          status: form.get("status"),
          title: form.get("title"),
          description: form.get("description"),
          location: form.get("location"),
          eventTime: new Date(String(form.get("eventTime") || Date.now())).toISOString(),
        }),
      });
      setNotice("Event recorded.");
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add the event.");
    }
  }

  async function uploadEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("shipmentId", id);
    data.set("isPublic", data.get("isPublic") === "on" ? "true" : "false");
    try {
      await api("/api/admin/evidence", { method: "POST", body: data });
      setNotice("Evidence uploaded.");
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    }
  }

  async function toggleArchive() {
    if (!detail) return;
    await api(`/api/admin/shipments/${id}`, { method: "PATCH", body: JSON.stringify({ archived: !detail.shipment.archivedAt }) });
    await load();
  }

  if (error && !detail) return <p className="text-red-700">{error}</p>;
  if (!detail) return <p className="text-steel">Loading shipment…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-steel">Shipment file</p>
          <h1 className="font-mono text-3xl font-semibold">{detail.shipment.trackingNumber}</h1>
        </div>
        <button onClick={toggleArchive} className="rounded-xl border border-line px-4 py-2 text-sm">
          {detail.shipment.archivedAt ? "Restore" : "Archive"}
        </button>
      </div>
      {notice ? <p className="text-sm text-emerald-800">{notice}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <ShipmentForm initial={detail.shipment} />
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-semibold">Tracking events</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {detail.events.map((item) => (
            <li key={item.id} className="border-b border-line pb-3">
              <div className="flex justify-between gap-3"><strong>{item.title}</strong><span className="text-steel">{formatDateTime(item.eventTime)}</span></div>
              <p className="text-steel">{statusLabel(item.status)}{item.location ? ` · ${item.location}` : ""}</p>
            </li>
          ))}
        </ul>
        <form onSubmit={addEvent} className="mt-5 grid gap-3 md:grid-cols-2">
          <select name="status" className="field" defaultValue="in_transit">
            {STATUSES.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
          </select>
          <input name="title" required placeholder="Event title" className="field" />
          <input name="location" placeholder="Location" className="field" />
          <input name="eventTime" type="datetime-local" className="field" />
          <textarea name="description" placeholder="Description" className="field md:col-span-2" rows={3} />
          <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Add event</button>
        </form>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-semibold">Evidence</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {detail.evidence.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2">
              <span>{item.title} · {item.evidenceType} {item.isPublic ? "· public" : "· private"}</span>
              <a className="underline" href={`/api/admin/evidence/${item.id}/file`}>Open</a>
            </li>
          ))}
        </ul>
        <form onSubmit={uploadEvidence} className="mt-5 grid gap-3 md:grid-cols-2">
          <select name="evidenceType" className="field" defaultValue="Documents">
            {EVIDENCE_TYPES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input name="title" required placeholder="Title" className="field" />
          <input name="files" type="file" multiple required className="field" />
          <label className="flex items-center gap-2 text-sm"><input name="isPublic" type="checkbox" /> Publish to public tracking</label>
          <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Upload</button>
        </form>
      </section>
    </div>
  );
}
