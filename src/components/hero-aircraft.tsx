"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { canUseWebgl } from "@/components/logistics/webgl";

const HeroAircraftCanvas = dynamic(() => import("./hero-aircraft-canvas").then((mod) => mod.HeroAircraftCanvas), {
  ssr: false,
});

export function HeroAircraft() {
  const [mode, setMode] = useState<"pending" | "model" | "photo">("pending");
  const [motion, setMotion] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotion(!reduce);
    setMode(canUseWebgl() ? "model" : "photo");
  }, []);

  if (mode === "photo") {
    return (
      <figure className="hero-stage overflow-hidden">
        <img src="/images/aircargo.jpg" alt="A freighter prepared for an NKDON air movement" className="h-full w-full object-cover" />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071018] via-[#071018cc] to-transparent px-5 pb-4 pt-16 text-sm text-white/80">
          The interactive aircraft is off on this display. This is the night photograph instead.
        </figcaption>
      </figure>
    );
  }

  return (
    <div className="hero-stage" role="img" aria-label="NKDON Global Logistics freighter in silver, with teal and amber details">
      <div className="hero-harbor" aria-hidden="true" />
      {mode === "model" ? <HeroAircraftCanvas motion={motion} /> : <p className="relative z-[1] px-6 pt-16 text-sm text-white/70">Bringing the freighter into view…</p>}
    </div>
  );
}
