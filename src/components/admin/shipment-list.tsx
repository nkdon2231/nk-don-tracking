"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can, STATUSES, STATUS_LABEL } from "@/lib/constants";
import { formatWhen } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import { AdminFrame, useStaff } from "./shell";
import type { Shipment } from "./types";
import { Banner, Empty } from "./ui";

type List = { items: Shipment[]; page: number; pageSize: number; total: number };

export function ShipmentList() {
  return (
    <AdminFrame>
      <ListBody />
    </AdminFrame>
  );
}

function ListBody() {
  const session = useStaff();
  const router = useRouter();
  const search = useSearchParams();
  const query = search.toString();
  const [data, setData] = useState<List | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    api<List>(`/api/admin/shipments?${query}`)
      .then((result) => {
        if (!cancel) setData(result);
      })
      .catch((caught) => {
        if (!cancel) setError(caught instanceof ApiError ? caught.message : "Shipments could not be loaded.");
      });
    return () => {
      cancel = true;
    };
  }, [query]);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "status", "from", "to"]) {
      const value = String(form.get(key) ?? "");
      if (value) params.set(key, value);
    }
    if (form.get("archived") === "on") params.set("archived", "1");
    router.push(`/admin/shipments?${params.toString()}`);
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Ledger</p>
          <h1 className="serif text-4xl">Shipments</h1>
        </div>
        {can(session.user.role, "shipments:write") ? (
          <Link className="btn btn-primary" href="/admin/shipments/new">
            New shipment
          </Link>
        ) : null}
      </header>
      <form className="card grid gap-3 p-4 md:grid-cols-6" onSubmit={apply}>
        <label className="field md:col-span-2">
          <span>Search</span>
          <input name="q" defaultValue={search.get("q") ?? ""} placeholder="Tracking, reference, or name" />
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={search.get("status") ?? ""}>
            <option value="">Any</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>From</span>
          <input name="from" type="date" defaultValue={search.get("from") ?? ""} />
        </label>
        <label className="field">
          <span>To</span>
          <input name="to" type="date" defaultValue={search.get("to") ?? ""} />
        </label>
        <div className="flex items-end gap-3">
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input name="archived" type="checkbox" defaultChecked={search.get("archived") === "1"} />
            Archived
          </label>
          <button className="btn btn-ghost mb-0.5" type="submit">
            Filter
          </button>
        </div>
      </form>
      {error ? <Banner>{error}</Banner> : null}
      {!data && !error ? <p className="text-sm text-[var(--color-muted)]">Loading shipments…</p> : null}
      {data && data.items.length === 0 ? <Empty title="Nothing matches">Adjust the filter, or book a shipment when there is a real movement.</Empty> : null}
      <div className="grid gap-3">
        {data?.items.map((item) => (
          <Link key={item.id} href={`/admin/shipments/${item.id}`} className="card grid gap-2 p-4 no-underline sm:grid-cols-[1.2fr_1fr_auto] sm:items-center">
            <div>
              <p className="font-semibold">{item.trackingNumber}</p>
              <p className="text-sm text-[var(--color-muted)]">
                {item.referenceNumber || "No reference"} · {item.serviceLabel}
                {item.courierName ? ` · ${item.courierName}` : ""}
                {item.courierIsDemo ? " · DEMO courier" : ""}
                {item.isDemo ? " · DEMO/TEST" : ""}
                {item.archivedAt ? " · Archived" : ""}
              </p>
            </div>
            <p className="text-sm">
              {[item.senderCity || item.senderCountry, item.recipientCity || item.recipientCountry].filter(Boolean).join(" → ") || "Route not set"}
              <span className="block text-[var(--color-muted)]">{formatWhen(item.createdAt)}</span>
            </p>
            <StatusPill status={item.status} />
          </Link>
        ))}
      </div>
      {data && data.total > data.pageSize ? (
        <div className="flex items-center justify-between text-sm">
          <p>
            Page {data.page} of {pages} · {data.total} records
          </p>
          <div className="flex gap-2">
            <PageLink search={search} page={data.page - 1} disabled={data.page <= 1} label="Previous" />
            <PageLink search={search} page={data.page + 1} disabled={data.page >= pages} label="Next" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PageLink({ search, page, disabled, label }: { search: { toString(): string }; page: number; disabled: boolean; label: string }) {
  if (disabled) return <span className="btn btn-ghost opacity-40">{label}</span>;
  const params = new URLSearchParams(search.toString());
  params.set("page", String(page));
  return (
    <Link className="btn btn-ghost" href={`/admin/shipments?${params.toString()}`}>
      {label}
    </Link>
  );
}
