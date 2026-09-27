"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can } from "@/lib/constants";
import { AdminFrame, useStaff } from "./shell";
import { ShipmentForm } from "./shipment-form";
import type { Facility, Shipment } from "./types";
import { Banner } from "./ui";

export function ShipmentCreate() {
  return (
    <AdminFrame>
      <CreateBody />
    </AdminFrame>
  );
}

function CreateBody() {
  const session = useStaff();
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ items: Facility[] }>("/api/admin/facilities")
      .then((result) => setFacilities(result.items))
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Facilities could not be loaded."));
  }, []);

  if (!can(session.user.role, "shipments:write")) {
    return <Banner>Your role can review shipments, not create them.</Banner>;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">New record</p>
        <h1 className="serif text-4xl">Book a shipment</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          A tracking number is issued when you save. The first event uses the status you choose. Sender and recipient names stay off the public page.
        </p>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      <ShipmentForm
        facilities={facilities}
        submitLabel="Issue tracking number"
        onSubmit={async (payload) => {
          const result = await api<{ shipment: Shipment }>("/api/admin/shipments", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          router.replace(`/admin/shipments/${result.shipment.id}`);
        }}
      />
    </div>
  );
}
