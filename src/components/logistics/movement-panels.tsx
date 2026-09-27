"use client";

import { formatWhen } from "@/lib/format";

type EventRow = {
  status: string;
  statusLabel?: string;
  title: string;
  description?: string;
  location?: string;
  eventTime: string | null;
};

type FileRow = {
  key: string;
  title: string;
  evidenceType: string;
  href?: string;
};

export function CustomsPanel({ events, files }: { events: EventRow[]; files: FileRow[] }) {
  const customsEvents = events.filter((event) => event.status === "customs_clearance");
  const customsFiles = files.filter((file) => file.evidenceType === "Customs" || file.evidenceType === "Clearance");
  const empty = customsEvents.length === 0 && customsFiles.length === 0;
  return (
    <section className="card p-5">
      <h3 className="serif text-3xl">Customs and clearance</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        This shows clearance events and customs files that were actually recorded. It is not a government approval, stamp, or declaration.
      </p>
      {empty ? <p className="mt-4 text-sm text-[var(--color-muted)]">No customs or clearance records have been added for this shipment.</p> : null}
      <ol className="mt-4 grid gap-3">
        {customsEvents.map((event) => (
          <li key={`${event.eventTime}-${event.title}`} className="border-l-2 border-[var(--color-copper)] pl-4">
            <p className="text-xs text-[var(--color-muted)]">{formatWhen(event.eventTime, true)}</p>
            <p className="font-semibold">{event.title}</p>
            {event.location ? <p className="text-sm">{event.location}</p> : null}
            {event.description ? <p className="text-sm leading-6 text-[var(--color-muted)]">{event.description}</p> : null}
          </li>
        ))}
      </ol>
      {customsFiles.length ? (
        <ul className="mt-4 grid gap-2 text-sm">
          {customsFiles.map((file) => (
            <li key={file.key}>
              {file.href ? (
                <a href={file.href} target="_blank" rel="noreferrer">
                  {file.title}
                </a>
              ) : (
                file.title
              )}
              <span className="text-[var(--color-muted)]"> · {file.evidenceType}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function DeliveryPanel({
  status,
  statusLabel,
  actualDeliveryDate,
  files,
}: {
  status: string;
  statusLabel: string;
  actualDeliveryDate: string | null;
  files: FileRow[];
}) {
  const proof = files.filter((file) => file.evidenceType === "Delivery" || file.evidenceType === "Signature");
  const moving = status === "out_for_delivery" || status === "delivered";
  if (!moving && proof.length === 0) {
    return (
      <section className="card p-5">
        <h3 className="serif text-3xl">Delivery</h3>
        <p className="mt-3 text-sm text-[var(--color-muted)]">No delivery or proof-of-delivery record has been added.</p>
      </section>
    );
  }
  return (
    <section className="card p-5">
      <h3 className="serif text-3xl">Delivery</h3>
      <p className="mt-3 text-sm leading-6">
        Current status: {statusLabel}.
        {actualDeliveryDate ? ` Recorded delivery date ${formatWhen(actualDeliveryDate)}.` : " No delivery date has been recorded yet."}
      </p>
      {proof.length === 0 ? <p className="mt-3 text-sm text-[var(--color-muted)]">No proof-of-delivery file has been uploaded.</p> : null}
      <ul className="mt-3 grid gap-2 text-sm">
        {proof.map((file) => (
          <li key={file.key}>
            {file.href ? (
              <a href={file.href} target="_blank" rel="noreferrer">
                {file.title}
              </a>
            ) : (
              file.title
            )}
            <span className="text-[var(--color-muted)]"> · {file.evidenceType}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
