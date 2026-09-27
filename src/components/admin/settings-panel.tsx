"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can } from "@/lib/constants";
import { AdminFrame, useStaff } from "./shell";
import type { SessionInfo } from "./types";
import { Banner, PASSWORD_HINT } from "./ui";

type Settings = {
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  operatingHours: string;
  defaultWeightUnit: string;
  defaultCurrency: string;
};

const DB: Record<string, string> = {
  supabase: "Supabase Postgres",
  postgres: "Postgres",
  preview: "Local preview database — not production",
  unconfigured: "Not connected",
};

const STORAGE: Record<string, string> = {
  supabase: "Private Supabase bucket shipment-evidence",
  "local-preview": "Local preview files — not production",
  unconfigured: "Not connected",
};

export function SettingsPanel() {
  return (
    <AdminFrame>
      <SettingsBody />
    </AdminFrame>
  );
}

function SettingsBody() {
  const session = useStaff();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [meta, setMeta] = useState<Pick<SessionInfo, "database" | "storage" | "notifications"> | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const writable = can(session.user.role, "settings:write");

  useEffect(() => {
    api<{ settings: Settings; database: string; storage: string; notifications: SessionInfo["notifications"] }>("/api/admin/settings")
      .then((result) => {
        setSettings(result.settings);
        setMeta({ database: result.database, storage: result.storage, notifications: result.notifications });
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Settings could not be loaded."));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!writable) return;
    const form = new FormData(event.currentTarget);
    setError("");
    try {
      const result = await api<{ settings: Settings }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          companyName: form.get("companyName"),
          tagline: form.get("tagline"),
          phone: form.get("phone") ?? "",
          email: form.get("email") ?? "",
          address: form.get("address") ?? "",
          website: form.get("website") ?? "",
          operatingHours: form.get("operatingHours") ?? "",
          defaultWeightUnit: form.get("defaultWeightUnit"),
          defaultCurrency: String(form.get("defaultCurrency") ?? "").toUpperCase(),
        }),
      });
      setSettings(result.settings);
      setNotice("Company profile saved.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Settings could not be saved.");
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <div>
        <h1 className="serif text-4xl">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Company profile used by the desk. Connection status is shown without revealing keys or passwords.</p>
      </div>
      {meta ? (
        <section className="grid gap-3 sm:grid-cols-2">
          <article className="card p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">Database</p>
            <p className="mt-2 font-semibold">{DB[meta.database] ?? meta.database}</p>
          </article>
          <article className="card p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">Evidence storage</p>
            <p className="mt-2 font-semibold">{STORAGE[meta.storage] ?? meta.storage}</p>
          </article>
          <article className="card p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">Notifications</p>
            <p className="mt-2 text-sm">
              Email {meta.notifications.email ? "connected" : "not connected"} · SMS {meta.notifications.sms ? "connected" : "not connected"} · WhatsApp{" "}
              {meta.notifications.whatsapp ? "connected" : "not connected"}
            </p>
          </article>
        </section>
      ) : null}
      {notice ? <Banner tone="ok">{notice}</Banner> : null}
      {error ? <Banner>{error}</Banner> : null}
      {settings ? (
        <form className="card grid gap-3 p-5" onSubmit={save}>
          <h2 className="serif text-2xl">Company</h2>
          <label className="field">
            <span>Name</span>
            <input name="companyName" required maxLength={160} defaultValue={settings.companyName} disabled={!writable} />
          </label>
          <label className="field">
            <span>Tagline</span>
            <input name="tagline" required maxLength={240} defaultValue={settings.tagline} disabled={!writable} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span>Phone</span>
              <input name="phone" maxLength={40} defaultValue={settings.phone} disabled={!writable} />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" maxLength={200} defaultValue={settings.email} disabled={!writable} />
            </label>
          </div>
          <label className="field">
            <span>Address</span>
            <input name="address" maxLength={300} defaultValue={settings.address} disabled={!writable} />
          </label>
          <label className="field">
            <span>Website</span>
            <input name="website" maxLength={200} defaultValue={settings.website} disabled={!writable} placeholder="https://" />
          </label>
          <label className="field">
            <span>Hours</span>
            <input name="operatingHours" maxLength={200} defaultValue={settings.operatingHours} disabled={!writable} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span>Default weight</span>
              <select name="defaultWeightUnit" defaultValue={settings.defaultWeightUnit} disabled={!writable}>
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </label>
            <label className="field">
              <span>Currency</span>
              <input name="defaultCurrency" required maxLength={3} defaultValue={settings.defaultCurrency} disabled={!writable} />
            </label>
          </div>
          {writable ? (
            <button className="btn btn-primary w-fit" type="submit">
              Save profile
            </button>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">A super admin can edit this profile.</p>
          )}
        </form>
      ) : null}
      <PasswordCard onError={setError} onOk={setNotice} />
      {can(session.user.role, "demo:purge") ? <PurgeCard onError={setError} onOk={setNotice} /> : null}
    </div>
  );
}

function PasswordCard({ onError, onOk }: { onError: (message: string) => void; onOk: (message: string) => void }) {
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/admin/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: form.get("currentPassword"), password: form.get("password") }),
      });
      event.currentTarget.reset();
      onOk("Password changed.");
    } catch (caught) {
      onError(caught instanceof ApiError ? caught.message : "The password could not be changed.");
    }
  }

  return (
    <form className="card grid gap-3 p-5" onSubmit={save}>
      <h2 className="serif text-2xl">Your password</h2>
      <label className="field">
        <span>Current password</span>
        <input name="currentPassword" type="password" required autoComplete="current-password" />
      </label>
      <label className="field">
        <span>New password</span>
        <input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
      </label>
      <p className="text-xs text-[var(--color-muted)]">{PASSWORD_HINT}</p>
      <button className="btn btn-ghost w-fit" type="submit">
        Update password
      </button>
    </form>
  );
}

function PurgeCard({ onError, onOk }: { onError: (message: string) => void; onOk: (message: string) => void }) {
  async function purge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ removedFiles: number }>("/api/admin/demo/purge", {
        method: "POST",
        body: JSON.stringify({ confirm: form.get("confirm") }),
      });
      event.currentTarget.reset();
      onOk(`Demonstration records removed. ${result.removedFiles} demo file${result.removedFiles === 1 ? "" : "s"} deleted.`);
    } catch (caught) {
      onError(caught instanceof ApiError ? caught.message : "Demo data could not be removed.");
    }
  }

  return (
    <form className="card grid gap-3 border-[#efd2c2] p-5" onSubmit={purge}>
      <h2 className="serif text-2xl">Remove demonstration data</h2>
      <p className="text-sm leading-6 text-[var(--color-muted)]">
        Deletes shipments, events, evidence, and unused facilities marked DEMO/TEST. Real records are left in place. Type DELETE DEMO DATA to confirm.
      </p>
      <label className="field">
        <span>Confirmation</span>
        <input name="confirm" autoComplete="off" placeholder="DELETE DEMO DATA" />
      </label>
      <button className="btn btn-copper w-fit" type="submit">
        Remove demo records
      </button>
    </form>
  );
}
