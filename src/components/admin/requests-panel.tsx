"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can, SPEEDS } from "@/lib/constants";
import { formatWhen } from "@/lib/format";
import { AdminFrame, useStaff } from "./shell";
import { Banner, Empty } from "./ui";

type Item = {
  id: string;
  kind: string;
  status: string;
  serviceLabel: string;
  shipmentTypeLabel: string;
  speed: string;
  pickupAddress: string;
  pickupCity: string;
  pickupCountry: string;
  destinationAddress: string;
  destinationCity: string;
  destinationCountry: string;
  packageCount: number;
  weight: number | null;
  weightUnit: string;
  dimensions: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  company: string;
  recipientName: string;
  recipientPhone: string;
  instructions: string;
  estimateNote: string;
  staffNote: string;
  shipmentId: string | null;
  trackingNumber: string;
  createdAt: string | null;
};

const STATUSES = ["", "pending", "in_review", "booked", "closed", "declined"];

export function RequestsPanel() {
  return (
    <AdminFrame>
      <Queue />
    </AdminFrame>
  );
}

function Queue() {
  const session = useStaff();
  const writable = can(session.user.role, "shipments:write");
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function load(next = status) {
    const query = next ? `?status=${encodeURIComponent(next)}` : "";
    const result = await api<{ items: Item[] }>(`/api/admin/requests${query}`);
    setItems(result.items);
  }

  useEffect(() => {
    load().catch((caught) => setError(caught instanceof ApiError ? caught.message : "Requests could not be loaded."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function review(nextStatus: "in_review" | "closed" | "declined" | "booked", form?: FormData) {
    if (!selected) return;
    setPending(true);
    setError("");
    setNotice("");
    try {
      const result = await api<{ request: Item; shipment: { id: string; trackingNumber: string } | null }>(`/api/admin/requests/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          staffNote: String(form?.get("staffNote") ?? selected.staffNote ?? ""),
          recipientName: String(form?.get("recipientName") ?? ""),
          recipientPhone: String(form?.get("recipientPhone") ?? ""),
        }),
      });
      setSelected(result.request);
      setNotice(
        result.shipment
          ? `Shipment ${result.shipment.trackingNumber} was opened as pickup scheduled. It is not delivered and it has no price.`
          : `Request marked ${result.request.status.replaceAll("_", " ")}.`,
      );
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The request could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-4xl">Requests</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Quotes and pickup requests wait here until staff review them. Booking opens a real shipment. Nothing on this list is a confirmed price.
          </p>
        </div>
        <Link href="/admin/lanes" className="text-sm text-[var(--color-lane)] no-underline">
          Transit windows
        </Link>
      </header>
      {error ? <Banner>{error}</Banner> : null}
      {notice ? <Banner tone="ok">{notice}</Banner> : null}
      <label className="field max-w-xs">
        <span>Status</span>
        <select
          value={status}
          onChange={(event) => {
            const next = event.target.value;
            setStatus(next);
            load(next).catch((caught) => setError(caught instanceof ApiError ? caught.message : "Requests could not be loaded."));
          }}
        >
          {STATUSES.map((item) => (
            <option key={item || "all"} value={item}>
              {item ? item.replaceAll("_", " ") : "All"}
            </option>
          ))}
        </select>
      </label>
      {items.length === 0 ? <Empty title="No requests">Quote and pickup forms will appear here after a customer submits one.</Empty> : null}
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <ul className="grid gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`card w-full px-4 py-3 text-left ${selected?.id === item.id ? "border-[var(--color-copper)]" : ""}`}
                onClick={() => {
                  setSelected(item);
                  setNotice("");
                }}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-copper)]">
                  {item.kind} · {item.status.replaceAll("_", " ")}
                </p>
                <p className="mt-1 font-semibold">
                  {item.pickupCity} → {item.destinationCity}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {item.contactName} · {item.serviceLabel}
                </p>
              </button>
            </li>
          ))}
        </ul>
        {selected ? (
          <article className="card grid gap-3 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{formatWhen(selected.createdAt, true)}</p>
            <h2 className="serif text-3xl">
              {selected.pickupCity}, {selected.pickupCountry} → {selected.destinationCity}, {selected.destinationCountry}
            </h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--color-muted)]">Service</dt>
                <dd>
                  {selected.serviceLabel} · {selected.shipmentTypeLabel}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Speed preference</dt>
                <dd>{SPEEDS.find((item) => item.value === selected.speed)?.label ?? selected.speed}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Pieces / weight</dt>
                <dd>
                  {selected.packageCount}
                  {selected.weight != null ? ` · ${selected.weight} ${selected.weightUnit}` : ""}
                  {selected.dimensions ? ` · ${selected.dimensions}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Contact</dt>
                <dd>
                  {selected.contactName}
                  {selected.company ? ` · ${selected.company}` : ""}
                  <br />
                  {selected.contactEmail}
                  {selected.contactPhone ? ` · ${selected.contactPhone}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Pickup</dt>
                <dd>{selected.pickupAddress || "No street address"}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Destination</dt>
                <dd>{selected.destinationAddress || "No street address"}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Recipient</dt>
                <dd>
                  {selected.recipientName || "Not provided"}
                  {selected.recipientPhone ? ` · ${selected.recipientPhone}` : ""}
                </dd>
              </div>
            </dl>
            {selected.instructions ? <p className="text-sm leading-6">{selected.instructions}</p> : null}
            {selected.estimateNote ? <p className="text-sm leading-6 text-[var(--color-muted)]">Shown to the customer: {selected.estimateNote}</p> : null}
            {selected.trackingNumber ? (
              <p className="text-sm">
                Opened as{" "}
                <Link href={`/admin/shipments/${selected.shipmentId}`} className="font-semibold">
                  {selected.trackingNumber}
                </Link>
              </p>
            ) : null}
            {writable && selected.status !== "booked" ? (
              <form
                className="grid gap-3 border-t border-[var(--color-line)] pt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                  const next = submitter?.value;
                  if (next === "in_review" || next === "closed" || next === "declined" || next === "booked") {
                    void review(next, new FormData(event.currentTarget));
                  }
                }}
              >
                <label className="field">
                  <span>Recipient name, if it was missing</span>
                  <input name="recipientName" defaultValue={selected.recipientName} maxLength={160} />
                </label>
                <label className="field">
                  <span>Recipient phone</span>
                  <input name="recipientPhone" defaultValue={selected.recipientPhone} maxLength={40} />
                </label>
                <label className="field">
                  <span>Staff note</span>
                  <textarea name="staffNote" defaultValue={selected.staffNote} maxLength={2000} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-ghost" name="intent" value="in_review" disabled={pending} type="submit">
                    Mark in review
                  </button>
                  <button className="btn btn-primary" name="intent" value="booked" disabled={pending} type="submit">
                    Open shipment
                  </button>
                  <button className="btn btn-ghost" name="intent" value="closed" disabled={pending} type="submit">
                    Close without booking
                  </button>
                  <button className="btn btn-ghost" name="intent" value="declined" disabled={pending} type="submit">
                    Decline
                  </button>
                </div>
              </form>
            ) : null}
            {selected.staffNote && selected.status === "booked" ? <p className="text-sm text-[var(--color-muted)]">{selected.staffNote}</p> : null}
          </article>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">Select a request to review it.</p>
        )}
      </div>
    </div>
  );
}
