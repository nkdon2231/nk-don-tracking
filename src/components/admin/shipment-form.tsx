"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/client";
import { SERVICE_TYPES, SHIPMENT_TYPES, STATUSES } from "@/lib/constants";
import { statusLabel } from "@/lib/format";

type Facility = { id: string; name: string; facilityCode: string };
type Shipment = Record<string, string | number | boolean | null>;

const empty: Record<string, string> = {
  referenceNumber: "",
  status: "pickup_scheduled",
  serviceType: "express_courier",
  shipmentType: "parcel",
  senderName: "",
  senderCompany: "",
  senderPhone: "",
  senderEmail: "",
  senderAddress: "",
  senderCity: "",
  senderCountry: "",
  recipientName: "",
  recipientCompany: "",
  recipientPhone: "",
  recipientEmail: "",
  recipientAddress: "",
  recipientCity: "",
  recipientCountry: "",
  originFacilityId: "",
  destinationFacilityId: "",
  currentFacilityId: "",
  packageCount: "1",
  weight: "",
  weightUnit: "kg",
  publicDescription: "",
  internalNotes: "",
  estimatedDeliveryDate: "",
  actualDeliveryDate: "",
  isDemo: "false",
};

export function ShipmentForm({ initial }: { initial?: Shipment }) {
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [values, setValues] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ items: Facility[] }>("/api/admin/facilities").then((data) => setFacilities(data.items)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!initial) return;
    const next = { ...empty };
    for (const key of Object.keys(empty)) {
      const value = initial[key];
      if (value == null) continue;
      next[key] = String(value);
    }
    setValues(next);
  }, [initial]);

  function set(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      ...values,
      packageCount: Number(values.packageCount || 1),
      weight: values.weight === "" ? null : Number(values.weight),
      originFacilityId: values.originFacilityId || null,
      destinationFacilityId: values.destinationFacilityId || null,
      currentFacilityId: values.currentFacilityId || null,
      estimatedDeliveryDate: values.estimatedDeliveryDate || null,
      actualDeliveryDate: values.actualDeliveryDate || null,
      isDemo: values.isDemo === "true",
    };
    try {
      if (initial?.id) {
        await api(`/api/admin/shipments/${initial.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        router.refresh();
      } else {
        const created = await api<{ shipment: { id: string } }>("/api/admin/shipments", { method: "POST", body: JSON.stringify(payload) });
        router.replace(`/admin/shipments/${created.shipment.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the shipment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-line bg-white p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Reference"><input value={values.referenceNumber} onChange={(e) => set("referenceNumber", e.target.value)} className="field" /></Field>
        <Field label="Status">
          <select value={values.status} onChange={(e) => set("status", e.target.value)} className="field">
            {STATUSES.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
          </select>
        </Field>
        <Field label="Service">
          <select value={values.serviceType} onChange={(e) => set("serviceType", e.target.value)} className="field">
            {SERVICE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select value={values.shipmentType} onChange={(e) => set("shipmentType", e.target.value)} className="field">
            {SHIPMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Packages"><input type="number" min={1} value={values.packageCount} onChange={(e) => set("packageCount", e.target.value)} className="field" /></Field>
        <Field label="Weight">
          <div className="flex gap-2">
            <input value={values.weight} onChange={(e) => set("weight", e.target.value)} className="field" />
            <select value={values.weightUnit} onChange={(e) => set("weightUnit", e.target.value)} className="field max-w-20">
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Shipper name"><input required value={values.senderName} onChange={(e) => set("senderName", e.target.value)} className="field" /></Field>
        <Field label="Shipper city"><input value={values.senderCity} onChange={(e) => set("senderCity", e.target.value)} className="field" /></Field>
        <Field label="Shipper country"><input value={values.senderCountry} onChange={(e) => set("senderCountry", e.target.value)} className="field" /></Field>
        <Field label="Consignee name"><input required value={values.recipientName} onChange={(e) => set("recipientName", e.target.value)} className="field" /></Field>
        <Field label="Consignee city"><input value={values.recipientCity} onChange={(e) => set("recipientCity", e.target.value)} className="field" /></Field>
        <Field label="Consignee country"><input value={values.recipientCountry} onChange={(e) => set("recipientCountry", e.target.value)} className="field" /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Origin facility">
          <select value={values.originFacilityId} onChange={(e) => set("originFacilityId", e.target.value)} className="field">
            <option value="">None</option>
            {facilities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="Current facility">
          <select value={values.currentFacilityId} onChange={(e) => set("currentFacilityId", e.target.value)} className="field">
            <option value="">None</option>
            {facilities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="Destination facility">
          <select value={values.destinationFacilityId} onChange={(e) => set("destinationFacilityId", e.target.value)} className="field">
            <option value="">None</option>
            {facilities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="Estimated delivery"><input type="date" value={values.estimatedDeliveryDate} onChange={(e) => set("estimatedDeliveryDate", e.target.value)} className="field" /></Field>
        <Field label="Demo record">
          <select value={values.isDemo} onChange={(e) => set("isDemo", e.target.value)} className="field">
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </Field>
        <Field label="Public description"><textarea value={values.publicDescription} onChange={(e) => set("publicDescription", e.target.value)} className="field" rows={3} /></Field>
        <Field label="Internal notes"><textarea value={values.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} className="field" rows={3} /></Field>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button disabled={busy} className="rounded-xl bg-ink px-5 py-3 font-semibold text-white disabled:opacity-60">
        {busy ? "Saving…" : initial?.id ? "Save shipment" : "Create shipment"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
