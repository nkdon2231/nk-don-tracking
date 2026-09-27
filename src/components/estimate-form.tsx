"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ApiError, api } from "@/lib/client-api";
import { SERVICE_TYPES, SPEEDS } from "@/lib/constants";

type Estimate = {
  available: boolean;
  message: string;
  transitMinDays?: number;
  transitMaxDays?: number;
  note?: string;
};

export function EstimateForm() {
  const [result, setResult] = useState<Estimate | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    setResult(null);
    try {
      const estimate = await api<Estimate>("/api/estimate", {
        method: "POST",
        body: JSON.stringify({
          serviceType: data.get("serviceType"),
          originCountry: data.get("originCountry"),
          destinationCountry: data.get("destinationCountry"),
          speed: data.get("speed"),
        }),
      });
      setResult(estimate);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The window could not be checked.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Origin country</span>
          <input name="originCountry" required maxLength={120} />
        </label>
        <label className="field">
          <span>Destination country</span>
          <input name="destinationCountry" required maxLength={120} />
        </label>
      </div>
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
      {error ? <p className="rounded-xl border border-[#8a4a32] bg-[#2a1814] px-4 py-3 text-sm text-[#ffd0c2]">{error}</p> : null}
      {result ? (
        <div className="rounded-2xl border border-[var(--color-line)] px-4 py-4">
          <p className="text-sm leading-6">{result.message}</p>
          {result.available ? (
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
              {result.transitMinDays}–{result.transitMaxDays} days · staff-published window
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Checking…" : "Check window"}
        </button>
        <Link className="btn btn-ghost" href="/quote">
          Request a quote
        </Link>
      </div>
    </form>
  );
}
