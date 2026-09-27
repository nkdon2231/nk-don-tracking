"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can, SERVICE_TYPES, SPEEDS } from "@/lib/constants";
import { AdminFrame, useStaff } from "./shell";
import { Banner, Empty } from "./ui";

type Lane = {
  id: string;
  serviceType: string;
  serviceLabel: string;
  originCountry: string;
  destinationCountry: string;
  speed: string;
  transitMinDays: number;
  transitMaxDays: number;
  note: string;
  isActive: boolean;
};

export function LanesPanel() {
  return (
    <AdminFrame>
      <Lanes />
    </AdminFrame>
  );
}

function Lanes() {
  const session = useStaff();
  const writable = can(session.user.role, "lanes:write");
  const [items, setItems] = useState<Lane[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    const result = await api<{ items: Lane[] }>("/api/admin/lanes");
    setItems(result.items);
  }

  useEffect(() => {
    load().catch((caught) => setError(caught instanceof ApiError ? caught.message : "Transit windows could not be loaded."));
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      await api("/api/admin/lanes", {
        method: "POST",
        body: JSON.stringify({
          serviceType: data.get("serviceType"),
          originCountry: data.get("originCountry"),
          destinationCountry: data.get("destinationCountry"),
          speed: data.get("speed"),
          transitMinDays: data.get("transitMinDays"),
          transitMaxDays: data.get("transitMaxDays"),
          note: data.get("note") ?? "",
          isActive: true,
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The window could not be saved.");
    } finally {
      setPending(false);
    }
  }

  async function toggle(lane: Lane) {
    setError("");
    try {
      await api(`/api/admin/lanes/${lane.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...lane, isActive: !lane.isActive }),
      });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The window could not be updated.");
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <div>
        <h1 className="serif text-4xl">Transit windows</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Publish a day range only for a lane you actually operate. Customers see it as a planning window, not a guarantee and not a price. If no window is published, the estimator says staff confirmation is required.
        </p>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {writable ? (
        <form className="card grid gap-3 p-4 md:grid-cols-3" onSubmit={create}>
          <label className="field">
            <span>Service</span>
            <select name="serviceType" defaultValue={SERVICE_TYPES[0].value}>
              {SERVICE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Origin country</span>
            <input name="originCountry" required maxLength={120} />
          </label>
          <label className="field">
            <span>Destination country</span>
            <input name="destinationCountry" required maxLength={120} />
          </label>
          <label className="field">
            <span>Speed</span>
            <select name="speed" defaultValue="standard">
              {SPEEDS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Earliest days</span>
            <input name="transitMinDays" type="number" min={1} max={180} required />
          </label>
          <label className="field">
            <span>Latest days</span>
            <input name="transitMaxDays" type="number" min={1} max={180} required />
          </label>
          <label className="field md:col-span-3">
            <span>Note shown with the window</span>
            <input name="note" maxLength={400} placeholder="Optional. Do not promise a date the range does not support." />
          </label>
          <button className="btn btn-primary md:col-span-3 md:w-fit" disabled={pending} type="submit">
            {pending ? "Saving…" : "Publish window"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">Only an admin can publish or retire a window.</p>
      )}
      {items.length === 0 ? <Empty title="No published windows">The public estimator will keep asking for staff confirmation.</Empty> : null}
      <ul className="grid gap-3">
        {items.map((lane) => (
          <li key={lane.id} className="card flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <p className="font-semibold">
                {lane.originCountry} → {lane.destinationCountry}
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                {lane.serviceLabel} · {SPEEDS.find((item) => item.value === lane.speed)?.label ?? lane.speed} · {lane.transitMinDays}–{lane.transitMaxDays} days
                {lane.isActive ? "" : " · inactive"}
              </p>
              {lane.note ? <p className="mt-1 text-sm">{lane.note}</p> : null}
            </div>
            {writable ? (
              <button className="btn btn-ghost" type="button" onClick={() => void toggle(lane)}>
                {lane.isActive ? "Retire" : "Publish again"}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
