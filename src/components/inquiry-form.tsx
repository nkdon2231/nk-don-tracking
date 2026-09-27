"use client";

import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/client";

export function InquiryForm({
  topic,
  heading,
  intro,
  submitLabel,
}: {
  topic: string;
  heading: string;
  intro: string;
  submitLabel: string;
}) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ message: string }>("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          topic,
          message: form.get("message"),
        }),
      });
      setStatus(result.message || "Your request has been recorded.");
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to send the request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-semibold">{heading}</h1>
      <p className="mt-2 text-sm leading-6 text-steel">{intro}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Name
          <input name="name" required className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3" />
        </label>
        <label className="text-sm font-medium">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Phone
          <input name="phone" className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Details
          <textarea name="message" required minLength={10} rows={6} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3" />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {status ? <p className="mt-3 text-sm text-emerald-800">{status}</p> : null}
      <button disabled={busy} className="mt-5 rounded-xl bg-ink px-5 py-3 font-semibold text-white disabled:opacity-60">
        {busy ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
