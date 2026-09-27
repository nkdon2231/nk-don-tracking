"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can } from "@/lib/constants";
import { AdminFrame, useStaff } from "./shell";
import type { Courier } from "./types";
import { Banner, Empty } from "./ui";

export function CouriersPanel() {
  return (
    <AdminFrame>
      <CouriersBody />
    </AdminFrame>
  );
}

function CouriersBody() {
  const session = useStaff();
  const [items, setItems] = useState<Courier[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const write = can(session.user.role, "shipments:write");

  async function reload() {
    const data = await api<{ items: Courier[] }>("/api/admin/couriers");
    setItems(data.items);
  }

  useEffect(() => {
    let cancel = false;
    api<{ items: Courier[] }>("/api/admin/couriers")
      .then((data) => {
        if (!cancel) setItems(data.items);
      })
      .catch((caught) => {
        if (!cancel) setError(caught instanceof ApiError ? caught.message : "Couriers could not be loaded.");
      });
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Field</p>
        <h1 className="serif text-4xl">Couriers</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Add a courier only when you have a real assignment, or mark the record DEMO/TEST. Phone, notes, and photos stay on the desk. Customers see the name and vehicle only.
        </p>
      </header>
      {notice ? <Banner tone="ok">{notice}</Banner> : null}
      {error ? <Banner>{error}</Banner> : null}
      {!items && !error ? <p className="text-sm text-[var(--color-muted)]">Loading couriers…</p> : null}
      {items && items.length === 0 ? <Empty title="No couriers have been added">The desk does not invent drivers, vehicles, or photographs.</Empty> : null}
      <div className="grid gap-3">
        {items?.map((courier) => (
          <article key={courier.id} className="card grid gap-3 p-4 sm:grid-cols-[72px_1fr]">
            {courier.hasPhoto ? (
              <img src={`/api/admin/couriers/${courier.id}/photo`} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--color-sand)] text-xs text-[var(--color-muted)]">No photo</div>
            )}
            <div>
              <p className="font-semibold">
                {courier.name} <span className="text-sm font-normal text-[var(--color-muted)]">{courier.courierCode}</span>
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                {courier.vehicle || "No vehicle recorded"}
                {courier.isDemo ? " · DEMO/TEST" : ""}
                {courier.isActive ? "" : " · Inactive"}
                {typeof courier.assignedCount === "number" ? ` · ${courier.assignedCount} open assignment${courier.assignedCount === 1 ? "" : "s"}` : ""}
              </p>
              {courier.phone ? <p className="text-sm">Phone {courier.phone}</p> : null}
              {courier.notes ? <p className="text-sm leading-6">{courier.notes}</p> : null}
              {session.user.role === "viewer" ? <p className="text-xs text-[var(--color-muted)]">Phone and notes are hidden for the viewer role.</p> : null}
            </div>
          </article>
        ))}
      </div>
      {write ? (
        <CourierForm
          onDone={async () => {
            setNotice("Courier saved.");
            setError("");
            await reload();
          }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

function CourierForm({ onDone, onError }: { onDone: () => Promise<void>; onError: (message: string) => void }) {
  const [pending, setPending] = useState(false);

  async function handle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    setPending(true);
    onError("");
    try {
      const created = await api<{ courier: Courier }>("/api/admin/couriers", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          courierCode: form.get("courierCode"),
          vehicle: form.get("vehicle") ?? "",
          phone: form.get("phone") ?? "",
          notes: form.get("notes") ?? "",
          isActive: true,
          isDemo: form.get("isDemo") === "on",
        }),
      });
      if (file instanceof File && file.size > 0) {
        const photo = new FormData();
        photo.set("file", file);
        await api(`/api/admin/couriers/${created.courier.id}/photo`, { method: "POST", body: photo });
      }
      event.currentTarget.reset();
      await onDone();
    } catch (caught) {
      onError(caught instanceof ApiError ? caught.message : "The courier could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="card grid gap-3 p-5" onSubmit={handle}>
      <h2 className="serif text-2xl">Add a courier</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span>Name</span>
          <input name="name" required maxLength={160} />
        </label>
        <label className="field">
          <span>Courier code</span>
          <input name="courierCode" required minLength={2} maxLength={40} placeholder="NKD-DRV-01" />
        </label>
        <label className="field">
          <span>Vehicle</span>
          <input name="vehicle" maxLength={120} placeholder="Only if you know it" />
        </label>
        <label className="field">
          <span>Phone</span>
          <input name="phone" maxLength={40} />
        </label>
        <label className="field sm:col-span-2">
          <span>Notes</span>
          <textarea name="notes" maxLength={2000} />
        </label>
        <label className="field sm:col-span-2">
          <span>Photo</span>
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" />
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input className="mt-1" name="isDemo" type="checkbox" />
        <span>DEMO/TEST. Use this only for a sample courier, never for a real person.</span>
      </label>
      <button className="btn btn-primary w-fit" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save courier"}
      </button>
    </form>
  );
}

export function CourierAssign({
  shipmentId,
  shipmentIsDemo,
  courier,
  onChanged,
}: {
  shipmentId: string;
  shipmentIsDemo: boolean;
  courier: Courier | null;
  onChanged: (message: string) => Promise<void>;
}) {
  const session = useStaff();
  const [items, setItems] = useState<Courier[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const write = can(session.user.role, "shipments:write");

  useEffect(() => {
    let cancel = false;
    api<{ items: Courier[] }>("/api/admin/couriers")
      .then((data) => {
        if (!cancel) setItems(data.items);
      })
      .catch(() => {
        if (!cancel) setItems([]);
      });
    return () => {
      cancel = true;
    };
  }, [courier?.id]);

  const choices = items.filter((item) => item.isActive && item.isDemo === shipmentIsDemo);

  return (
    <section className="card p-5">
      <h2 className="serif text-3xl">Courier</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        Assignment is manual. A demonstration courier can only be attached to a demonstration shipment. The public page shows the name and vehicle, not the phone, notes, or photo.
      </p>
      {courier ? (
        <div className="mt-4 flex gap-3">
          {courier.hasPhoto ? (
            <img src={`/api/admin/couriers/${courier.id}/photo`} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--color-sand)] text-xs text-[var(--color-muted)]">No photo</div>
          )}
          <div>
            <p className="font-semibold">
              {courier.name} · {courier.courierCode}
              {courier.isDemo ? " · DEMO/TEST" : ""}
              {courier.isActive ? "" : " · Inactive"}
            </p>
            <p className="text-sm text-[var(--color-muted)]">{courier.vehicle || "No vehicle recorded"}</p>
            {courier.phone ? <p className="text-sm">Phone {courier.phone}</p> : null}
            {courier.notes ? <p className="text-sm">{courier.notes}</p> : null}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-muted)]">No courier has been assigned.</p>
      )}
      {write ? (
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setPending(true);
            setError("");
            try {
              await api(`/api/admin/shipments/${shipmentId}/courier`, {
                method: "POST",
                body: JSON.stringify({ courierId: form.get("courierId") || null }),
              });
              await onChanged(form.get("courierId") ? "Courier assigned." : "Courier removed.");
            } catch (caught) {
              setError(caught instanceof ApiError ? caught.message : "The assignment could not be saved.");
            } finally {
              setPending(false);
            }
          }}
        >
          <label className="field min-w-64">
            <span>Assign</span>
            <select key={courier?.id ?? "none"} name="courierId" defaultValue={courier?.id ?? ""}>
              <option value="">No courier</option>
              {choices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.courierCode}
                  {item.isDemo ? " · DEMO" : ""}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-copper" disabled={pending} type="submit">
            {pending ? "Saving…" : "Update assignment"}
          </button>
        </form>
      ) : null}
      {write && choices.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          {shipmentIsDemo ? "No active demonstration couriers have been added." : "No active couriers have been added."}
        </p>
      ) : null}
      {error ? (
        <div className="mt-3">
          <Banner>{error}</Banner>
        </div>
      ) : null}
    </section>
  );
}
