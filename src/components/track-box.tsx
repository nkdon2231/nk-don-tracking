"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TRACKING_RE } from "@/lib/constants";

export function TrackBox({ initial = "", compact = false }: { initial?: string; compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [hint, setHint] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const number = value.trim().toUpperCase();
    if (!TRACKING_RE.test(number)) {
      setHint("Use the format NKD-YYYYMMDD-XXXX.");
      return;
    }
    setHint("");
    router.push(`/tracking?number=${encodeURIComponent(number)}`);
  }

  return (
    <form onSubmit={submit} className={compact ? "" : "rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6"}>
      {!compact && (
        <>
          <h2 className="text-xl font-semibold">Track a shipment</h2>
          <p className="mt-1 text-sm text-steel">Enter the NKDON tracking number issued at pickup or booking.</p>
        </>
      )}
      <div className={`flex flex-col gap-3 sm:flex-row ${compact ? "" : "mt-4"}`}>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value.toUpperCase())}
          placeholder="NKD-20260924-4034"
          autoComplete="off"
          className="min-h-12 flex-1 rounded-xl border border-line bg-cream px-4 outline-none focus:border-ink"
        />
        <button type="submit" className="min-h-12 rounded-xl bg-ink px-6 font-semibold text-white">
          Track
        </button>
      </div>
      {hint ? <p className="mt-2 text-sm text-red-700">{hint}</p> : null}
    </form>
  );
}
