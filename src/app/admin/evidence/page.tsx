"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client";
import { EVIDENCE_TYPES } from "@/lib/constants";
import { bytes, formatDateTime } from "@/lib/format";

type Item = { id: string; title: string; evidenceType: string; trackingNumber: string; isPublic: boolean; fileSize: number; createdAt: string | null };

export default function EvidencePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState("");

  async function load(event?: FormEvent) {
    event?.preventDefault();
    try {
      const data = await api<{ items: Item[] }>(`/api/admin/evidence?${new URLSearchParams({ q, type })}`);
      setItems(data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load evidence.");
    }
  }

  useEffect(() => { void load(); }, []);

  async function togglePublic(item: Item) {
    try {
      await api(`/api/admin/evidence/${item.id}`, { method: "PATCH", body: JSON.stringify({ evidenceType: item.evidenceType, title: item.title, isPublic: !item.isPublic }) });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update visibility.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this evidence file?")) return;
    try {
      await api(`/api/admin/evidence/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the file.");
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Evidence</h1>
      <form onSubmit={load} className="flex flex-col gap-3 sm:flex-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or tracking" className="field" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="field sm:max-w-48">
          <option value="">All types</option>
          {EVIDENCE_TYPES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Filter</button>
      </form>
      {error ? <p className="text-red-700">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cream text-xs uppercase text-steel"><tr><th className="px-4 py-3">File</th><th className="px-4 py-3">Shipment</th><th className="px-4 py-3">Visibility</th><th className="px-4 py-3">Created</th><th className="px-4 py-3"></th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.title}<div className="text-xs text-steel">{item.evidenceType} · {bytes(item.fileSize)}</div></td>
                <td className="px-4 py-3 font-mono">{item.trackingNumber}</td>
                <td className="px-4 py-3">{item.isPublic ? "Public" : "Private"}</td>
                <td className="px-4 py-3 text-steel">{formatDateTime(item.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <a className="mr-3 underline" href={`/api/admin/evidence/${item.id}/file`}>Open</a>
                  <button className="mr-3 underline" onClick={() => togglePublic(item)}>{item.isPublic ? "Make private" : "Publish"}</button>
                  <button className="text-red-700 underline" onClick={() => remove(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
