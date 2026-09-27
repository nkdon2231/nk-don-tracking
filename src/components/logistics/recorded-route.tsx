"use client";

import { formatWhen } from "@/lib/format";
import type { RoutePoint } from "@/lib/route";

function layout(points: RoutePoint[]) {
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  if (maxLat - minLat < 0.8) {
    const mid = (maxLat + minLat) / 2;
    minLat = mid - 0.4;
    maxLat = mid + 0.4;
  }
  if (maxLng - minLng < 0.8) {
    const mid = (maxLng + minLng) / 2;
    minLng = mid - 0.4;
    maxLng = mid + 0.4;
  }
  const padLat = (maxLat - minLat) * 0.16;
  const padLng = (maxLng - minLng) * 0.16;
  minLat -= padLat;
  maxLat += padLat;
  minLng -= padLng;
  maxLng += padLng;
  return {
    placed: points.map((point, index) => ({
      ...point,
      index,
      x: 36 + ((point.longitude - minLng) / (maxLng - minLng)) * 568,
      y: 28 + ((maxLat - point.latitude) / (maxLat - minLat)) * 220,
    })),
    minLat,
    maxLat,
    minLng,
    maxLng,
  };
}

const ROLE_COLOR: Record<RoutePoint["role"], string> = {
  origin: "#e7c7ae",
  recorded: "#8fbfa8",
  current: "#d08a5a",
  destination: "#f7f3ea",
};

export function RecordedRoute({ points }: { points: RoutePoint[] }) {
  const drawn = points.length ? layout(points) : null;
  return (
    <section className="min-w-0 overflow-hidden rounded-[1.4rem] bg-[#14241e] text-[#f4efe6]">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[#e7c7ae]">Recorded route</p>
          <h3 className="serif text-2xl">Locations on the file</h3>
        </div>
        <p className="text-right text-[0.68rem] uppercase tracking-[0.14em] text-white/55">Not live GPS</p>
      </div>
      {drawn ? (
        <svg viewBox="0 0 640 280" width="100%" role="img" aria-label="Recorded shipment locations" className="mt-2 block h-auto w-full">
          {[0, 1, 2, 3, 4].map((line) => (
            <line key={`h-${line}`} x1="28" x2="612" y1={36 + line * 52} y2={36 + line * 52} stroke="rgba(255,255,255,0.08)" />
          ))}
          {[0, 1, 2, 3, 4, 5].map((line) => (
            <line key={`v-${line}`} y1="24" y2="256" x1={48 + line * 104} x2={48 + line * 104} stroke="rgba(255,255,255,0.08)" />
          ))}
          <polyline
            fill="none"
            stroke="#e7c7ae"
            strokeWidth="1.6"
            points={drawn.placed.map((point) => `${point.x},${point.y}`).join(" ")}
          />
          {drawn.placed.map((point) => (
            <g key={`${point.role}-${point.index}`}>
              <circle cx={point.x} cy={point.y} r={point.role === "current" || point.role === "destination" ? 7 : 5} fill={ROLE_COLOR[point.role]} />
              <text x={point.x + 10} y={point.y - 8} fill="#f4efe6" fontSize="11">
                {point.index + 1}
              </text>
            </g>
          ))}
        </svg>
      ) : (
        <p className="px-5 py-12 text-sm leading-6 text-white/70">
          No recorded locations have been added. City names are not converted into a position.
        </p>
      )}
      <div className="grid gap-2 px-5 pb-5">
        <p className="text-xs leading-5 text-white/55">
          Points come from coordinates saved on tracking events, or from an origin or destination facility that already has coordinates. This is not a live vehicle position.
        </p>
        {drawn?.placed.map((point) => (
          <p key={`${point.label}-${point.index}`} className="text-sm leading-5">
            <span className="text-white/50">{point.index + 1}. </span>
            {point.label}
            <span className="block text-xs text-white/50">
              {point.statusLabel || point.role}
              {point.eventTime ? ` · ${formatWhen(point.eventTime, true)}` : ""}
              {" · "}
              {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
              {point.source === "facility" ? " · facility record" : " · event record"}
            </span>
          </p>
        ))}
      </div>
    </section>
  );
}
