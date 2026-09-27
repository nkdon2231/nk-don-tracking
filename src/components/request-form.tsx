"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ApiError, api } from "@/lib/client-api";
import { SERVICE_TYPES, SHIPMENT_TYPES, SPEEDS } from "@/lib/constants";

type Estimate = { available: boolean; message: string };

export function RequestForm({ kind, initialService = "" }: { kind: "quote" | "booking"; initialService?: string }) {
  const booking = kind === "booking";
  const knownService = SERVICE_TYPES.some((item) => item.value === initialService) ? initialService : SERVICE_TYPES[0].value;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [checking, setChecking] = useState(false);

  async function checkWindow(form: HTMLFormElement) {
    const data = new FormData(form);
    setChecking(true);
    setEstimate(null);
    try {
      const result = await api<Estimate>("/api/estimate", {
        method: "POST",
        body: JSON.stringify({
          serviceType: data.get("serviceType"),
          originCountry: data.get("pickupCountry"),
          destinationCountry: data.get("destinationCountry"),
          speed: data.get("speed"),
        }),
      });
      setEstimate(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The transit window could not be checked.");
    } finally {
      setChecking(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ message: string }>("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          kind,
          serviceType: data.get("serviceType"),
          shipmentType: data.get("shipmentType"),
          speed: data.get("speed"),
          pickupAddress: data.get("pickupAddress") ?? "",
          pickupCity: data.get("pickupCity"),
          pickupCountry: data.get("pickupCountry"),
          destinationAddress: data.get("destinationAddress") ?? "",
          destinationCity: data.get("destinationCity"),
          destinationCountry: data.get("destinationCountry"),
          packageCount: data.get("packageCount") || 1,
          weight: data.get("weight") ?? "",
          weightUnit: data.get("weightUnit") || "kg",
          dimensions: data.get("dimensions") ?? "",
          contactName: data.get("contactName"),
          contactEmail: data.get("contactEmail"),
          contactPhone: data.get("contactPhone") ?? "",
          company: data.get("company") ?? "",
          recipientName: data.get("recipientName") ?? "",
          recipientPhone: data.get("recipientPhone") ?? "",
          instructions: data.get("instructions") ?? "",
          estimateNote: estimate?.message ?? "",
        }),
      });
      setMessage(result.message);
      form.reset();
      setEstimate(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The request could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <p className="text-sm leading-6 text-[var(--color-muted)]">
        {booking
          ? "This asks operations to review a pickup. It does not confirm collection, open a tracking number, or calculate a price."
          : "This asks operations to review a quote. The site does not calculate a price."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Service</span>
          <select name="serviceType" defaultValue={knownService} required>
            {SERVICE_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Package type</span>
          <select name="shipmentType" defaultValue="parcel" required>
            {SHIPMENT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Preferred speed</span>
        <select name="speed" defaultValue="standard">
          {SPEEDS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field sm:col-span-2">
          <span>Pickup address {booking ? "" : "(optional for a quote)"}</span>
          <input name="pickupAddress" required={booking} maxLength={300} />
        </label>
        <label className="field">
          <span>Pickup city</span>
          <input name="pickupCity" required maxLength={120} />
        </label>
        <label className="field">
          <span>Pickup country</span>
          <input name="pickupCountry" required maxLength={120} />
        </label>
        <label className="field sm:col-span-2">
          <span>Destination address {booking ? "" : "(optional for a quote)"}</span>
          <input name="destinationAddress" required={booking} maxLength={300} />
        </label>
        <label className="field">
          <span>Destination city</span>
          <input name="destinationCity" required maxLength={120} />
        </label>
        <label className="field">
          <span>Destination country</span>
          <input name="destinationCountry" required maxLength={120} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="field">
          <span>Pieces</span>
          <input name="packageCount" type="number" min={1} max={10000} defaultValue={1} required />
        </label>
        <label className="field">
          <span>Weight</span>
          <input name="weight" inputMode="decimal" maxLength={12} />
        </label>
        <label className="field">
          <span>Unit</span>
          <select name="weightUnit" defaultValue="kg">
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>Dimensions</span>
        <input name="dimensions" maxLength={120} placeholder="L × W × H, if you have them" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Your name</span>
          <input name="contactName" required maxLength={160} />
        </label>
        <label className="field">
          <span>Company</span>
          <input name="company" maxLength={160} />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="contactEmail" type="email" required maxLength={200} />
        </label>
        <label className="field">
          <span>Phone</span>
          <input name="contactPhone" maxLength={40} />
        </label>
        <label className="field">
          <span>Recipient name {booking ? "" : "(optional)"}</span>
          <input name="recipientName" required={booking} maxLength={160} />
        </label>
        <label className="field">
          <span>Recipient phone</span>
          <input name="recipientPhone" maxLength={40} />
        </label>
      </div>
      <label className="field">
        <span>Special instructions</span>
        <textarea name="instructions" maxLength={4000} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="btn btn-ghost"
          type="button"
          disabled={checking}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) void checkWindow(form);
          }}
        >
          {checking ? "Checking…" : "Check published window"}
        </button>
        <Link href="/estimate" className="text-sm text-[var(--color-lane)]">
          Open the estimator
        </Link>
      </div>
      {estimate ? <p className="text-sm leading-6 text-[var(--color-muted)]">{estimate.message}</p> : null}
      {error ? <p className="rounded-xl border border-[#8a4a32] bg-[#2a1814] px-4 py-3 text-sm text-[#ffd0c2]">{error}</p> : null}
      {message ? <p className="text-sm leading-6 text-[var(--color-lane)]">{message}</p> : null}
      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Sending…" : booking ? "Submit pickup request" : "Submit quote request"}
      </button>
    </form>
  );
}
