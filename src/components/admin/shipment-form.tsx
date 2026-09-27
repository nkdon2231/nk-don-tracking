"use client";

import { FormEvent, useState } from "react";
import { SERVICE_TYPES, SHIPMENT_TYPES, STATUSES, STATUS_LABEL } from "@/lib/constants";
import type { Facility, Shipment } from "./types";
import { Banner, readText } from "./ui";

export function shipmentPayload(form: FormData, status: string) {
  const text = (key: string) => readText(form, key);
  const blank = (key: string) => text(key) || null;
  return {
    referenceNumber: text("referenceNumber"),
    status,
    serviceType: text("serviceType"),
    shipmentType: text("shipmentType"),
    senderName: text("senderName"),
    senderCompany: text("senderCompany"),
    senderPhone: text("senderPhone"),
    senderEmail: text("senderEmail"),
    senderAddress: text("senderAddress"),
    senderCity: text("senderCity"),
    senderState: text("senderState"),
    senderCountry: text("senderCountry"),
    recipientName: text("recipientName"),
    recipientCompany: text("recipientCompany"),
    recipientPhone: text("recipientPhone"),
    recipientEmail: text("recipientEmail"),
    recipientAddress: text("recipientAddress"),
    recipientCity: text("recipientCity"),
    recipientState: text("recipientState"),
    recipientCountry: text("recipientCountry"),
    originFacilityId: blank("originFacilityId"),
    destinationFacilityId: blank("destinationFacilityId"),
    currentFacilityId: blank("currentFacilityId"),
    packageCount: text("packageCount") || "1",
    weight: text("weight"),
    weightUnit: text("weightUnit") || "kg",
    dimensions: text("dimensions"),
    declaredValue: text("declaredValue"),
    currency: (text("currency") || "USD").toUpperCase(),
    description: text("description"),
    publicDescription: text("publicDescription"),
    internalNotes: text("internalNotes"),
    estimatedDeliveryDate: text("estimatedDeliveryDate"),
    actualDeliveryDate: text("actualDeliveryDate"),
    specialInstructions: text("specialInstructions"),
    isDemo: form.get("isDemo") === "on",
  };
}

export function ShipmentForm({
  shipment,
  facilities,
  submitLabel,
  onSubmit,
}: {
  shipment?: Shipment | null;
  facilities: Facility[];
  submitLabel: string;
  onSubmit: (payload: ReturnType<typeof shipmentPayload>) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const value = shipment;

  async function handle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const status = value ? value.status : readText(form, "status");
    setPending(true);
    setError("");
    try {
      await onSubmit(shipmentPayload(form, status));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The shipment could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handle}>
      <section className="card grid gap-4 p-5">
        <h2 className="serif text-2xl">Movement</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {value ? (
            <p className="text-sm text-[var(--color-muted)] sm:col-span-2">
              Status is {value.statusLabel}. Change it by adding a tracking event so the customer timeline stays intact.
            </p>
          ) : (
            <label className="field">
              <span>Initial status</span>
              <select name="status" defaultValue="pickup_scheduled">
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="field">
            <span>Reference</span>
            <input name="referenceNumber" defaultValue={value?.referenceNumber ?? ""} maxLength={80} />
          </label>
          <label className="field">
            <span>Service</span>
            <select name="serviceType" defaultValue={value?.serviceType ?? "express_courier"}>
              {SERVICE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Type</span>
            <select name="shipmentType" defaultValue={value?.shipmentType ?? "parcel"}>
              {SHIPMENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Party title="Sender" prefix="sender" shipment={value} />
        <Party title="Recipient" prefix="recipient" shipment={value} />
      </div>
      <section className="card grid gap-4 p-5">
        <h2 className="serif text-2xl">Facilities and cargo</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FacilityField name="originFacilityId" label="Origin facility" facilities={facilities} value={value?.originFacilityId} />
          <FacilityField name="destinationFacilityId" label="Destination facility" facilities={facilities} value={value?.destinationFacilityId} />
          <FacilityField name="currentFacilityId" label="Current facility" facilities={facilities} value={value?.currentFacilityId} />
          <label className="field">
            <span>Packages</span>
            <input name="packageCount" type="number" min={1} max={10000} required defaultValue={value?.packageCount ?? 1} />
          </label>
          <label className="field">
            <span>Weight</span>
            <input name="weight" type="number" min={0} step="0.01" defaultValue={value?.weight ?? ""} />
          </label>
          <label className="field">
            <span>Unit</span>
            <select name="weightUnit" defaultValue={value?.weightUnit || "kg"}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </label>
          <label className="field">
            <span>Dimensions</span>
            <input name="dimensions" defaultValue={value?.dimensions ?? ""} maxLength={120} />
          </label>
          <label className="field">
            <span>Declared value</span>
            <input name="declaredValue" type="number" min={0} step="0.01" defaultValue={value?.declaredValue ?? ""} />
          </label>
          <label className="field">
            <span>Currency</span>
            <input name="currency" defaultValue={value?.currency || "USD"} maxLength={3} required />
          </label>
          <label className="field">
            <span>Estimated delivery</span>
            <input name="estimatedDeliveryDate" type="date" defaultValue={value?.estimatedDeliveryDate ?? ""} />
          </label>
          <label className="field">
            <span>Actual delivery</span>
            <input name="actualDeliveryDate" type="date" defaultValue={value?.actualDeliveryDate ?? ""} />
          </label>
        </div>
      </section>
      <section className="card grid gap-4 p-5">
        <h2 className="serif text-2xl">What customers and staff can see</h2>
        <label className="field">
          <span>Public description</span>
          <textarea name="publicDescription" maxLength={500} defaultValue={value?.publicDescription ?? ""} />
        </label>
        <label className="field">
          <span>Internal description</span>
          <textarea name="description" maxLength={2000} defaultValue={value?.description ?? ""} />
        </label>
        <label className="field">
          <span>Internal notes</span>
          <textarea name="internalNotes" maxLength={4000} defaultValue={value?.internalNotes ?? ""} />
        </label>
        <label className="field">
          <span>Special instructions</span>
          <textarea name="specialInstructions" maxLength={2000} defaultValue={value?.specialInstructions ?? ""} />
        </label>
        <label className="flex items-start gap-3 text-sm leading-6">
          <input className="mt-1" name="isDemo" type="checkbox" defaultChecked={Boolean(value?.isDemo)} />
          <span>Mark this record DEMO/TEST. Use it only for a demonstration. Real customer shipments stay unmarked so they are not removed with demo data.</span>
        </label>
      </section>
      {error ? <Banner>{error}</Banner> : null}
      <button className="btn btn-primary w-fit" type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function Party({ title, prefix, shipment }: { title: string; prefix: "sender" | "recipient"; shipment?: Shipment | null }) {
  const field = (suffix: string) => {
    const key = `${prefix}${suffix}` as keyof Shipment;
    const current = shipment?.[key];
    return typeof current === "string" ? current : "";
  };
  return (
    <section className="card grid gap-4 p-5">
      <h2 className="serif text-2xl">{title}</h2>
      <label className="field">
        <span>Name</span>
        <input name={`${prefix}Name`} required maxLength={160} defaultValue={field("Name")} />
      </label>
      <label className="field">
        <span>Company</span>
        <input name={`${prefix}Company`} maxLength={160} defaultValue={field("Company")} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Phone</span>
          <input name={`${prefix}Phone`} maxLength={40} defaultValue={field("Phone")} />
        </label>
        <label className="field">
          <span>Email</span>
          <input name={`${prefix}Email`} type="email" maxLength={200} defaultValue={field("Email")} />
        </label>
      </div>
      <label className="field">
        <span>Address</span>
        <input name={`${prefix}Address`} maxLength={300} defaultValue={field("Address")} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="field">
          <span>City</span>
          <input name={`${prefix}City`} maxLength={120} defaultValue={field("City")} />
        </label>
        <label className="field">
          <span>State</span>
          <input name={`${prefix}State`} maxLength={120} defaultValue={field("State")} />
        </label>
        <label className="field">
          <span>Country</span>
          <input name={`${prefix}Country`} maxLength={120} defaultValue={field("Country")} />
        </label>
      </div>
    </section>
  );
}

export function FacilityField({
  name,
  label,
  facilities,
  value,
}: {
  name: string;
  label: string;
  facilities: Facility[];
  value?: string | null;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} defaultValue={value ?? ""}>
        <option value="">None</option>
        {facilities.map((facility) => (
          <option key={facility.id} value={facility.id}>
            {facility.name}
            {facility.isDemo ? " · DEMO" : ""}
            {facility.city ? ` · ${facility.city}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
