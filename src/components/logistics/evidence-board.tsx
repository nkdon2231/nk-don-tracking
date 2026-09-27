"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatBytes, formatWhen } from "@/lib/format";
import { EVIDENCE_STAGES, type EvidenceStageId } from "@/lib/stages";

export type EvidenceView = {
  key: string;
  href: string;
  title: string;
  evidenceType: string;
  fileType: string;
  fileSize: number;
  capturedAt: string | null;
  location: string;
  description: string;
  isDemo: boolean;
  visibility?: string;
  uploadedByName?: string;
};

export function EvidenceBoard({
  items,
  stage,
  onStage,
  empty,
  actions,
}: {
  items: EvidenceView[];
  stage: string;
  onStage: (stage: EvidenceStageId) => void;
  empty: string;
  actions?: (item: EvidenceView) => ReactNode;
}) {
  const active = EVIDENCE_STAGES.find((item) => item.id === stage) ?? EVIDENCE_STAGES[0];
  const visible = useMemo(() => {
    if (!active.types) return items;
    const types = new Set<string>(active.types);
    return items.filter((item) => types.has(item.evidenceType));
  }, [active, items]);
  const [open, setOpen] = useState<EvidenceView | null>(null);

  return (
    <section id="evidence" className="card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="serif text-3xl">Evidence</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Files stay as photos and PDFs. The stages only group what staff uploaded. An empty stage means that record has not been added.
          </p>
        </div>
      </div>
      <div className="mt-4 flex w-full min-w-0 gap-2 overflow-x-auto pb-1">
        {EVIDENCE_STAGES.map((item) => {
          const count = item.types ? items.filter((file) => (item.types as readonly string[]).includes(file.evidenceType)).length : items.length;
          return (
            <button
              key={item.id}
              type="button"
              className={`inline-flex min-h-11 items-center rounded-full border px-3 py-2 text-sm whitespace-nowrap ${
                active.id === item.id ? "border-[var(--color-copper)] bg-[var(--color-copper)] text-[#1a1203]" : "border-[var(--color-line)] bg-transparent"
              }`}
              onClick={() => onStage(item.id)}
            >
              {item.label}
              <span className="ml-1 text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
      {visible.length === 0 ? <p className="mt-5 text-sm leading-6 text-[var(--color-muted)]">{empty}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {visible.map((item) => {
          const image = item.fileType.startsWith("image/");
          return (
            <article key={item.key} className="grid gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-3">
              {image ? (
                <button type="button" className="overflow-hidden rounded-xl" onClick={() => setOpen(item)}>
                  <img src={item.href} alt="" className="h-40 w-full object-cover" loading="lazy" />
                </button>
              ) : (
                <div className="flex h-40 flex-col justify-between rounded-xl bg-[#071018] p-4 text-[#e7eef6]">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#e7c7ae]">Document</p>
                  <p className="serif text-3xl">PDF</p>
                  <a className="text-sm text-white" href={item.href} target="_blank" rel="noreferrer">
                    Open in a new tab
                  </a>
                </div>
              )}
              <div>
                <p className="font-semibold">
                  {item.title} {item.isDemo ? <span className="badge badge-warn">DEMO</span> : null}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {item.evidenceType} · {formatBytes(item.fileSize)}
                  {item.visibility ? ` · ${item.visibility}` : ""}
                  {item.capturedAt ? ` · ${formatWhen(item.capturedAt, true)}` : ""}
                </p>
                {item.location ? <p className="mt-1 text-sm">{item.location}</p> : null}
                {item.description ? <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{item.description}</p> : null}
                {item.uploadedByName ? <p className="mt-1 text-xs text-[var(--color-muted)]">Uploaded by {item.uploadedByName}</p> : null}
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {image ? (
                    <button type="button" className="underline" onClick={() => setOpen(item)}>
                      View
                    </button>
                  ) : null}
                  <a href={`${item.href}${item.href.includes("?") ? "&" : "?"}download=1`}>Download</a>
                </div>
                {actions ? <div className="mt-2">{actions(item)}</div> : null}
              </div>
            </article>
          );
        })}
      </div>
      {open ? <Lightbox item={open} siblings={visible.filter((item) => item.fileType.startsWith("image/"))} onClose={() => setOpen(null)} onOpen={setOpen} /> : null}
    </section>
  );
}

function Lightbox({
  item,
  siblings,
  onClose,
  onOpen,
}: {
  item: EvidenceView;
  siblings: EvidenceView[];
  onClose: () => void;
  onOpen: (item: EvidenceView) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [item.key]);

  return (
    <div className="fixed inset-0 z-50 grid content-end bg-[#071018]/94 p-3 text-[#f4f7fb] sm:content-center sm:p-8" role="dialog" aria-modal="true" aria-label={item.title}>
      <div className="mx-auto grid w-full max-w-5xl gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#e7c7ae]">{item.evidenceType}</p>
            <p className="serif text-2xl">{item.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn border border-white/30 px-3 py-1.5 text-sm text-white" onClick={() => setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))}>
              Zoom out
            </button>
            <button type="button" className="btn border border-white/30 px-3 py-1.5 text-sm text-white" onClick={() => setZoom((value) => Math.min(4, Number((value + 0.25).toFixed(2))))}>
              Zoom in
            </button>
            <button
              type="button"
              className="btn border border-white/30 px-3 py-1.5 text-sm text-white"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
            >
              Reset
            </button>
            <button type="button" className="btn btn-copper px-3 py-1.5 text-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div
          className="relative h-[58vh] overflow-hidden rounded-2xl bg-black/40"
          onPointerDown={(event) => {
            if (zoom <= 1) return;
            drag.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            setPan({ x: drag.current.px + event.clientX - drag.current.x, y: drag.current.py + event.clientY - drag.current.y });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          <img
            src={item.href}
            alt={item.title}
            className="h-full w-full object-contain"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center" }}
            draggable={false}
          />
        </div>
        <p className="text-sm text-white/70">
          {formatWhen(item.capturedAt, true)}
          {item.location ? ` · ${item.location}` : ""}
          {item.visibility ? ` · ${item.visibility}` : ""}
          {" · "}
          {formatBytes(item.fileSize)}
          {item.isDemo ? " · demonstration file" : ""}
        </p>
        {item.description ? <p className="text-sm leading-6 text-white/80">{item.description}</p> : null}
        {siblings.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto">
            {siblings.map((sibling) => (
              <button key={sibling.key} type="button" className={`h-16 w-16 overflow-hidden rounded-lg border ${sibling.key === item.key ? "border-[#d08a5a]" : "border-white/20"}`} onClick={() => onOpen(sibling)}>
                <img src={sibling.href} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
