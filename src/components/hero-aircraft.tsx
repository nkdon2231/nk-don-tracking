"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { canUseWebgl } from "@/components/logistics/webgl";

const HeroAircraftCanvas = dynamic(() => import("./hero-aircraft-canvas").then((mod) => mod.HeroAircraftCanvas), {
  ssr: false,
});

export function HeroBackdrop() {
  const [photo, setPhoto] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPhoto(!canUseWebgl());
    setReady(true);
  }, []);

  return (
    <>
      <img
        className="home-hero-bg"
        src={photo ? "/images/hero-freighter.jpg" : "/images/hero-harbor.jpg"}
        alt=""
      />
      <div className="home-hero-shade" aria-hidden="true" />
      <div className="home-hero-plane">{ready && !photo ? <HeroAircraft embedded /> : null}</div>
    </>
  );
}

export function HeroAircraft({ embedded = false }: { embedded?: boolean }) {
  const [mode, setMode] = useState<"pending" | "model" | "photo">("pending");
  const [motion, setMotion] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotion(!reduce);
    setMode(canUseWebgl() ? "model" : "photo");
  }, []);

  if (mode === "photo") {
    return (
      <figure className={embedded ? "absolute inset-0 overflow-hidden" : "hero-stage overflow-hidden"}>
        <img
          src={embedded ? "/images/hero-freighter.jpg" : "/images/aircargo.jpg"}
          alt="A silver freighter used as the QCORVAZENT night photograph"
          className="h-full w-full object-cover"
        />
        {embedded ? null : (
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071018] via-[#071018cc] to-transparent px-5 pb-4 pt-16 text-sm text-white/80">
            The interactive aircraft is off on this display. This is the night photograph instead.
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <div
      className={embedded ? "absolute inset-0" : "hero-stage"}
      role="img"
      aria-label="QCORVAZENT international freighter in silver, with a pale gold line, over open water at dusk"
    >
      {embedded ? null : <div className="hero-harbor" aria-hidden="true" />}
      {mode === "model" ? (
        <HeroAircraftCanvas motion={motion} embedded={embedded} />
      ) : embedded ? null : (
        <p className="relative z-[1] px-6 pt-16 text-sm text-white/70">Bringing the freighter into view…</p>
      )}
    </div>
  );
}
