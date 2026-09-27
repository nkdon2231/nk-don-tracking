"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client";

type Settings = { companyName: string; tagline: string; phone: string; email: string; address: string; website: string; operatingHours: string; defaultWeightUnit: string; defaultCurrency: string };

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [database, setDatabase] = useState("");
  const [storage, setStorage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    api<{ settings: Settings; database: string; storage: string }>("/api/admin/settings")
      .then((data) => {
        setSettings(data.settings);
        setDatabase(data.database);
        setStorage(data.storage);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    try {
      const data = await api<{ settings: Settings }>("/api/admin/settings", { method: "PATCH", body: JSON.stringify(settings) });
      setSettings(data.settings);
      setNotice("Settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save settings.");
    }
  }

  async function purge() {
    try {
      await api("/api/admin/demo/purge", { method: "POST", body: JSON.stringify({ confirm: confirmText }) });
      setNotice("Demonstration records were removed.");
      setConfirmText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Purge failed.");
    }
  }

  if (!settings && !error) return <p className="text-steel">Loading settings…</p>;
  if (!settings) return <p className="text-red-700">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Company settings</h1>
        <p className="text-sm text-steel">Database: {database} · Storage: {storage}</p>
      </div>
      {error ? <p className="text-red-700">{error}</p> : null}
      {notice ? <p className="text-emerald-800">{notice}</p> : null}
      <form onSubmit={save} className="grid gap-4 rounded-2xl border border-line bg-white p-5 md:grid-cols-2">
        {(["companyName", "tagline", "phone", "email", "address", "website", "operatingHours", "defaultCurrency"] as const).map((key) => (
          <label key={key} className="text-sm font-medium">
            {key}
            <input className="field mt-1" value={settings[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
          </label>
        ))}
        <label className="text-sm font-medium">
          Weight unit
          <select className="field mt-1" value={settings.defaultWeightUnit} onChange={(e) => setSettings({ ...settings, defaultWeightUnit: e.target.value })}>
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </label>
        <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Save settings</button>
      </form>
      <section className="rounded-2xl border border-red-200 bg-white p-5">
        <h2 className="font-semibold">Remove demonstration data</h2>
        <p className="mt-2 text-sm text-steel">Type DELETE DEMO DATA. Live shipments are not affected.</p>
        <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="field mt-3 max-w-md" />
        <button onClick={purge} className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white">Purge demo records</button>
      </section>
    </div>
  );
}
