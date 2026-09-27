"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client";
import { FACILITY_TYPES } from "@/lib/constants";

type Facility = { id: string; name: string; facilityCode: string; type: string; city: string; country: string; isActive: boolean; isDemo: boolean };

export default function FacilitiesPage() {
  const [items, setItems] = useState<Facility[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setItems((await api<{ items: Facility[] }>("/api/admin/facilities")).items);
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/admin/facilities", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          facilityCode: String(form.get("facilityCode") ?? "").toUpperCase(),
          type: form.get("type"),
          city: form.get("city"),
          country: form.get("country"),
          isActive: true,
          isDemo: form.get("isDemo") === "on",
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the facility.");
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Facilities</h1>
      {error ? <p className="text-red-700">{error}</p> : null}
      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-3">
        <input name="name" required placeholder="Name" className="field" />
        <input name="facilityCode" required placeholder="CODE" className="field" />
        <select name="type" className="field">{FACILITY_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
        <input name="city" placeholder="City" className="field" />
        <input name="country" placeholder="Country" className="field" />
        <label className="flex items-center gap-2 text-sm"><input name="isDemo" type="checkbox" /> Demo facility</label>
        <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Add facility</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cream text-xs uppercase text-steel"><tr><th className="px-4 py-3">Facility</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Flags</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3"><div className="font-semibold">{item.name}</div><div className="font-mono text-xs text-steel">{item.facilityCode}</div></td>
                <td className="px-4 py-3">{item.type}</td>
                <td className="px-4 py-3">{[item.city, item.country].filter(Boolean).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-xs">{item.isActive ? "Active" : "Inactive"}{item.isDemo ? " · demo" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
