"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { formatDateTime, statusLabel, statusTone } from "@/lib/format";

type Stats = {
  total: number;
  active: number;
  delivered: number;
  exceptions: number;
  inTransit: number;
  pickupScheduled: number;
  evidence: number;
  recentShipments: { id: string; trackingNumber: string; status: string; recipientName: string; createdAt: string | null }[];
  recentEvents: { id: string; title: string; status: string; createdAt: string | null }[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Stats>("/api/admin/stats")
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-700">{error}</p>;
  if (!stats) return <p className="text-steel">Loading dashboard…</p>;

  const cards = [
    ["Active", stats.active],
    ["In transit", stats.inTransit],
    ["Pickup scheduled", stats.pickupScheduled],
    ["Exceptions", stats.exceptions],
    ["Delivered", stats.delivered],
    ["Evidence files", stats.evidence],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Operations overview</h1>
          <p className="text-sm text-steel">{stats.total} shipment records on file.</p>
        </div>
        <Link href="/admin/shipments/new" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">
          New shipment
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-steel">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-semibold">Recent shipments</h2>
          <ul className="mt-4 space-y-3">
            {stats.recentShipments.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/admin/shipments/${item.id}`} className="font-mono font-semibold underline">
                  {item.trackingNumber}
                </Link>
                <span className={`rounded-full px-2 py-1 text-xs ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-semibold">Latest events</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {stats.recentEvents.map((item) => (
              <li key={item.id}>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-steel">
                  {statusLabel(item.status)} · {formatDateTime(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
