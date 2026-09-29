import { formatWhen } from "@/lib/format";
import { evidenceTimeline, type ProofEvent, type ProofFile } from "@/lib/proof";

export function EvidenceTimeline({
  events,
  files,
  title = "Evidence timeline",
}: {
  events: ProofEvent[];
  files: ProofFile[];
  title?: string;
}) {
  const rows = evidenceTimeline(events, files);
  return (
    <section className="card p-5">
      <h3 className="serif text-3xl">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        Events and released files, in the order they were recorded. A gap means that record has not been added.
      </p>
      {rows.length === 0 ? <p className="mt-4 text-sm text-[var(--color-muted)]">Nothing has been recorded on this file yet.</p> : null}
      <ol className="mt-4 grid gap-4">
        {rows.map((row) => (
          <li key={row.key} className="border-l-2 border-[var(--color-copper)] pl-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {row.kind === "file" ? "Evidence" : "Event"}
              {row.at ? ` · ${formatWhen(row.at, true)}` : ""}
            </p>
            <p className="font-semibold">{row.href ? <a href={row.href}>{row.title}</a> : row.title}</p>
            {row.detail ? <p className="text-sm leading-6 text-[var(--color-muted)]">{row.detail}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
