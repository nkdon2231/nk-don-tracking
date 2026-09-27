"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { JourneyMarker } from "@/lib/stages";
import { evidenceStageForStatus, vehicleKind, type EvidenceStageId } from "@/lib/stages";
import type { RoutePoint } from "@/lib/route";
import { canUseWebgl } from "./webgl";

const JourneyCanvas = dynamic(() => import("./journey-canvas").then((mod) => mod.JourneyCanvas), {
  ssr: false,
  loading: () => <p className="px-5 py-16 text-sm text-white/70">Preparing the shipment model…</p>,
});

export function ShipmentJourney({
  status,
  serviceType,
  markers,
  points,
  stage,
  onStage,
}: {
  status: string;
  serviceType: string;
  markers: JourneyMarker[];
  points: RoutePoint[];
  stage: string;
  onStage: (stage: EvidenceStageId) => void;
}) {
  const [mode, setMode] = useState<"pending" | "webgl" | "flat">("pending");
  const alert = status === "exception" || status === "cancelled";

  useEffect(() => {
    setMode(canUseWebgl() ? "webgl" : "flat");
  }, []);

  function select(id: string) {
    onStage(id === "package" ? "package" : evidenceStageForStatus(id));
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.4rem] bg-[#0c1a2c] text-[#e7eef6]">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-copper)]">Shipment model</p>
          <h3 className="serif text-2xl">Status, not a simulation</h3>
        </div>
        <p className="max-w-[9rem] text-right text-[0.68rem] uppercase tracking-[0.14em] text-white/55">
          {points.length ? "Recorded points" : "No coordinates"}
        </p>
      </div>
      <div className="mt-3 h-72 sm:h-80">
        {mode === "pending" ? <p className="px-5 text-sm text-white/70">Checking the display…</p> : null}
        {mode === "webgl" ? (
          <JourneyCanvas
            markers={markers}
            points={points}
            vehicle={vehicleKind(serviceType)}
            alert={alert}
            selected={stage}
            onSelect={select}
          />
        ) : null}
        {mode === "flat" ? (
          <div className="grid h-full content-center gap-3 px-5 pb-4">
            <p className="text-sm leading-6 text-white/75">
              This device is using the flat status view. The model is skipped when WebGL is unavailable, data saver is on, or memory is very limited.
            </p>
            <ol className="grid grid-cols-2 gap-2">
              {markers.map((marker) => (
                <li key={marker.id}>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-2 py-2 text-left text-xs ${
                      marker.state === "current" || marker.state === "alert"
                        ? "border-[#d08a5a] text-white"
                        : marker.state === "done"
                          ? "border-[#8fbfa8]/50 text-[#d7eee2]"
                          : "border-white/15 text-white/55"
                    }`}
                    onClick={() => select(marker.id)}
                  >
                    {marker.label}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
      <p className="px-5 pb-5 text-xs leading-5 text-white/60">
        Drag to turn the model. Select the parcel or a status point to filter evidence. The globe appears only when recorded coordinates exist. Nothing here is live GPS
        {alert ? ". This shipment is off the usual path." : "."}
      </p>
    </section>
  );
}
