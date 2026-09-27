"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can } from "@/lib/constants";
import { formatWhen } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import { AdminFrame, useStaff } from "./shell";
import type { EvidenceItem, Shipment, ShipmentEvent } from "./types";
import { Banner, Empty } from "./ui";

type Stats = {
  total: number;
  active: number;
  delivered: number;
  exceptions: number;
  inTransit: number;
  pickupScheduled: number;
  evidence: number;
  inquiries: number;
  recentShipments: Shipment[];
  recentEvents: ShipmentEvent[];
  recentEvidence: EvidenceItem[];
  recentInquiries: { id: string; name: string; email: string; topic: string; createdAt: string | null }[];
};

const MODE: Record<string, string> = {
  supabase: "Supabase",
  postgres: "Postgres",
  preview: "Local preview only",
  unconfigured: "Not connected",
  "local-preview": "Local preview files",
};

export function Dashboard() {
  return (
    <AdminFrame>
      <Desk />
    </AdminFrame>
  );
}

function Desk() {
  const session = useStaff();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Stats>("/api/admin/stats")
      .then(setStats)
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Counts could not be loaded."));
  }, []);

  const figures = stats
    ? [
        ["Open movements", stats.active],
        ["In transit", stats.inTransit],
        ["Pickup scheduled", stats.pickupScheduled],
        ["Exceptions", stats.exceptions],
        ["Delivered", stats.delivered],
        ["All records", stats.total],
        ["Evidence files", stats.evidence],
        ["Messages", stats.inquiries],
      ]
    : [];

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Live records</p>
          <h1 className="serif text-4xl">Good day, {session.user.name.split(" ")[0]}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
            Counts are taken from the connected database. Nothing on this desk is estimated or filled with sample customers.
          </p>
        </div>
        {can(session.user.role, "shipments:write") ? (
          <Link className="btn btn-primary" href="/admin/shipments/new">
            New shipment
          </Link>
        ) : null}
      </header>
      {session.database !== "supabase" && session.database !== "postgres" ? (
        <Banner>Database: {MODE[session.database] ?? session.database}. Storage: {MODE[session.storage] ?? session.storage}.</Banner>
      ) : (
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Database {MODE[session.database] ?? session.database} · Storage {MODE[session.storage] ?? session.storage}
        </p>
      )}
      {error ? <Banner>{error}</Banner> : null}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {figures.map(([label, count]) => (
          <article key={String(label)} className="card px-4 py-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">{label}</p>
            <p className="serif mt-2 text-4xl">{count}</p>
          </article>
        ))}
      </section>
      {!stats ? <p className="text-sm text-[var(--color-muted)]">Reading the ledger…</p> : null}
      {stats && stats.total === 0 ? (
        <Empty title="No shipments yet">Create a record when a real movement is booked. Leave the DEMO mark off unless you are testing.</Empty>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="serif text-2xl">Latest shipments</h2>
          <ul className="mt-4 grid gap-3">
            {stats?.recentShipments.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] pb-3 last:border-0">
                <div>
                  <Link href={`/admin/shipments/${item.id}`} className="font-semibold no-underline">
                    {item.trackingNumber}
                  </Link>
                  <p className="text-sm text-[var(--color-muted)]">
                    {[item.senderCity, item.recipientCity].filter(Boolean).join(" → ") || item.serviceLabel}
                    {item.isDemo ? " · DEMO" : ""}
                  </p>
                </div>
                <StatusPill status={item.status} />
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="serif text-2xl">Latest events</h2>
          <ul className="mt-4 grid gap-3">
            {stats?.recentEvents.map((event) => (
              <li key={event.id}>
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-[var(--color-muted)]">
                  {event.statusLabel} · {formatWhen(event.eventTime, true)}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
              </li>
            ))}
            {stats && stats.recentEvents.length === 0 ? <li className="text-sm text-[var(--color-muted)]">No events recorded.</li> : null}
          </ul>
        </section>
      </div>
      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="serif text-2xl">Messages</h2>
          <Link href="/admin/messages" className="text-sm">
            Open inbox
          </Link>
        </div>
        <ul className="mt-4 grid gap-3">
          {stats?.recentInquiries.map((item) => (
            <li key={item.id} className="text-sm">
              <span className="font-semibold">{item.name}</span>
              <span className="text-[var(--color-muted)]">
                {" "}
                · {item.topic || "General"} · {formatWhen(item.createdAt, true)}
              </span>
            </li>
          ))}
          {stats && stats.recentInquiries.length === 0 ? <li className="text-sm text-[var(--color-muted)]">No public messages yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
