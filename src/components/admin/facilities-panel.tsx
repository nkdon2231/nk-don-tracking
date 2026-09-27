"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can, FACILITY_TYPES } from "@/lib/constants";
import { AdminFrame, useStaff } from "./shell";
import type { Facility } from "./types";
import { Banner, Empty, readText } from "./ui";

export function FacilitiesPanel() {
  return (
    <AdminFrame>
      <FacilitiesBody />
    </AdminFrame>
  );
}

function FacilitiesBody() {
  const session = useStaff();
  const writable = can(session.user.role, "facilities:write");
  const [items, setItems] = useState<Facility[]>([]);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formKey, setFormKey] = useState(0);

  async function load() {
    const result = await api<{ items: Facility[] }>("/api/admin/facilities");
    setItems(result.items);
  }

  useEffect(() => {
    load().catch((caught) => setError(caught instanceof ApiError ? caught.message : "Facilities could not be loaded."));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: readText(form, "name"),
      facilityCode: readText(form, "facilityCode").toUpperCase(),
      type: readText(form, "type"),
      address: readText(form, "address"),
      city: readText(form, "city"),
      state: readText(form, "state"),
      country: readText(form, "country"),
      latitude: readText(form, "latitude"),
      longitude: readText(form, "longitude"),
      phone: readText(form, "phone"),
      email: readText(form, "email"),
      operatingHours: readText(form, "operatingHours"),
      isActive: form.get("isActive") === "on",
      isDemo: form.get("isDemo") === "on",
    };
    setError("");
    try {
      if (selected) {
        await api(`/api/admin/facilities/${selected.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        setNotice("Facility updated.");
      } else {
        await api("/api/admin/facilities", { method: "POST", body: JSON.stringify(payload) });
        setNotice("Facility added.");
        setFormKey((key) => key + 1);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The facility could not be saved.");
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <h1 className="serif text-4xl">Facilities</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Warehouses, airports, and delivery hubs used on shipment events. Mark test sites as DEMO.</p>
        <div className="mt-4 grid gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="card px-4 py-3 text-left"
              onClick={() => {
                setSelected(item);
                setFormKey((key) => key + 1);
              }}
            >
              <span className="font-semibold">{item.name}</span>
              <span className="mt-1 block text-sm text-[var(--color-muted)]">
                {item.facilityCode} · {item.type}
                {item.city ? ` · ${item.city}` : ""}
                {item.isDemo ? " · DEMO" : ""}
                {item.isActive ? "" : " · Inactive"}
              </span>
            </button>
          ))}
          {items.length === 0 ? <Empty title="No facilities yet" /> : null}
        </div>
      </div>
      {writable ? (
        <form key={formKey} className="card grid gap-3 p-5" onSubmit={onSubmit}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="serif text-2xl">{selected ? "Edit facility" : "New facility"}</h2>
            {selected ? (
              <button
                className="text-sm"
                type="button"
                onClick={() => {
                  setSelected(null);
                  setFormKey((key) => key + 1);
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
          <label className="field">
            <span>Name</span>
            <input name="name" required maxLength={160} defaultValue={selected?.name ?? ""} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span>Code</span>
              <input name="facilityCode" required minLength={2} maxLength={40} defaultValue={selected?.facilityCode ?? ""} placeholder="PHC-HQ" />
            </label>
            <label className="field">
              <span>Type</span>
              <select name="type" defaultValue={selected?.type ?? FACILITY_TYPES[0]}>
                {FACILITY_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Address</span>
            <input name="address" maxLength={300} defaultValue={selected?.address ?? ""} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="field">
              <span>City</span>
              <input name="city" maxLength={120} defaultValue={selected?.city ?? ""} />
            </label>
            <label className="field">
              <span>State</span>
              <input name="state" maxLength={120} defaultValue={selected?.state ?? ""} />
            </label>
            <label className="field">
              <span>Country</span>
              <input name="country" maxLength={120} defaultValue={selected?.country ?? ""} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span>Latitude</span>
              <input name="latitude" defaultValue={selected?.latitude ?? ""} />
            </label>
            <label className="field">
              <span>Longitude</span>
              <input name="longitude" defaultValue={selected?.longitude ?? ""} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input name="phone" maxLength={40} defaultValue={selected?.phone ?? ""} />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" maxLength={200} defaultValue={selected?.email ?? ""} />
            </label>
          </div>
          <label className="field">
            <span>Hours</span>
            <input name="operatingHours" maxLength={200} defaultValue={selected?.operatingHours ?? ""} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked={selected ? selected.isActive : true} />
            Active
          </label>
          <label className="flex items-start gap-2 text-sm leading-6">
            <input className="mt-1" name="isDemo" type="checkbox" defaultChecked={Boolean(selected?.isDemo)} />
            DEMO/TEST facility. Do not mark a real site.
          </label>
          {notice ? <Banner tone="ok">{notice}</Banner> : null}
          {error ? <Banner>{error}</Banner> : null}
          <button className="btn btn-primary w-fit" type="submit">
            {selected ? "Save facility" : "Add facility"}
          </button>
        </form>
      ) : (
        <Banner tone="muted">Your role can view facilities. An admin records new ones.</Banner>
      )}
    </div>
  );
}
