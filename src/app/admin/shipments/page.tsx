"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { STATUSES } from "@/lib/constants";
import { formatDateTime, statusLabel, statusTone } from "@/lib/format";

type Item = {
  id: string;
  trackingNumber: string;
  status: string;
  senderName: string;
  recipientName: string;
  serviceLabel: string;
  createdAt: string | null;
  isDemo: boolean;
};

export default function ShipmentsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [archived, setArchived] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  async function load(event?: FormEvent) {
    event?.preventDefault();
    const params = new URLSearchParams({ q, status, archived: archived ? "1" : "0", pageSize: "30" });
    try {
      const data = await api<{ items: Item[]; total: number }>(`/api/admin/shipments?${params}`);
      setItems(data.items);
      setTotal(data.total);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load shipments.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Shipments</h1>
          <p className="text-sm text-steel">{total} matching records</p>
        </div>
        <Link href="/admin/shipments/new" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">
          Create shipment
        </Link>
      </div>
      <form onSubmit={load} className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1fr_200px_auto_auto]">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tracking, names, reference" className="rounded-xl border border-line bg-cream px-3 py-2" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-line bg-cream px-3 py-2">
          <option value="">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {statusLabel(item)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          Archived
        </label>
        <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Filter</button>
      </form>
      {error ? <p className="text-red-700">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Tracking</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <Link href={`/admin/shipments/${item.id}`} className="font-mono font-semibold underline">
                    {item.trackingNumber}
                  </Link>
                  {item.isDemo ? <span className="ml-2 text-xs text-amber-800">demo</span> : null}
                </td>
                <td className="px-4 py-3">
                  {item.senderName} → {item.recipientName}
                </td>
                <td className="px-4 py-3">{item.serviceLabel}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
                </td>
                <td className="px-4 py-3 text-steel">{formatDateTime(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
