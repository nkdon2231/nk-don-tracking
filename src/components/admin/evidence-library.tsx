"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can, EVIDENCE_TYPES } from "@/lib/constants";
import { formatBytes, formatWhen } from "@/lib/format";
import { AdminFrame, useStaff } from "./shell";
import type { EvidenceItem } from "./types";
import { Banner, Empty } from "./ui";

export function EvidenceLibrary({ documents = false }: { documents?: boolean }) {
  return (
    <AdminFrame>
      <LibraryBody documents={documents} />
    </AdminFrame>
  );
}

function LibraryBody({ documents }: { documents: boolean }) {
  const session = useStaff();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(documents ? "group=documents" : "");

  async function load(next = query) {
    const result = await api<{ items: EvidenceItem[] }>(`/api/admin/evidence?${next}`);
    setItems(result.items);
  }

  useEffect(() => {
    let cancel = false;
    const initial = documents ? "group=documents" : "";
    api<{ items: EvidenceItem[] }>(`/api/admin/evidence${initial ? `?${initial}` : ""}`)
      .then((result) => {
        if (!cancel) setItems(result.items);
      })
      .catch((caught) => {
        if (!cancel) setError(caught instanceof ApiError ? caught.message : "Evidence could not be loaded.");
      });
    return () => {
      cancel = true;
    };
  }, [documents]);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "type", "visibility"]) {
      const value = String(form.get(key) ?? "");
      if (value) params.set(key, value);
    }
    if (documents) params.set("group", "documents");
    const next = params.toString();
    setQuery(next);
    load(next).catch((caught) => setError(caught instanceof ApiError ? caught.message : "Evidence could not be loaded."));
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <div>
        <h1 className="serif text-4xl">{documents ? "Documents" : "Evidence"}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          {documents
            ? "Waybills, customs files, clearance papers, and signatures staff uploaded. QCORVAZENT does not generate government forms, stamps, or labels."
            : "Private files stored with a shipment. Upload from the shipment itself. A public link appears only after the file is marked public."}
        </p>
      </div>
      <form className="card grid gap-3 p-4 md:grid-cols-4" onSubmit={apply}>
        <label className="field md:col-span-2">
          <span>Search</span>
          <input name="q" placeholder="Title or tracking number" />
        </label>
        <label className="field">
          <span>Type</span>
          <select name="type" defaultValue="">
            <option value="">Any</option>
            {EVIDENCE_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Visibility</span>
          <select name="visibility" defaultValue="">
            <option value="">Any</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <button className="btn btn-ghost w-fit" type="submit">
          Filter
        </button>
      </form>
      {error ? <Banner>{error}</Banner> : null}
      {items.length === 0 ? <Empty title="No evidence files" /> : null}
      <div className="grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="card grid gap-3 p-4 sm:grid-cols-[140px_1fr] sm:items-center">
            {item.fileType.startsWith("image/") ? (
              <img src={`/api/admin/evidence/${item.id}/file`} alt="" className="h-24 w-full rounded-xl object-cover" />
            ) : (
              <a className="btn btn-ghost" href={`/api/admin/evidence/${item.id}/file`}>
                Open PDF
              </a>
            )}
            <div>
              <p className="font-semibold">
                {item.title} {item.isDemo ? <span className="badge badge-warn">DEMO</span> : null}
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                {item.evidenceType} · {formatBytes(item.fileSize)} · {item.isPublic ? "Public" : "Private"} · {formatWhen(item.createdAt, true)}
              </p>
              <Link className="text-sm" href={`/admin/shipments/${item.shipmentId}`}>
                {item.trackingNumber || "Open shipment"}
              </Link>
              {can(session.user.role, "evidence:delete") ? (
                <button
                  className="ml-4 text-sm text-[#7a3e22]"
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Delete this evidence file?")) return;
                    try {
                      await api(`/api/admin/evidence/${item.id}`, { method: "DELETE" });
                      await load();
                    } catch (caught) {
                      setError(caught instanceof ApiError ? caught.message : "Delete failed.");
                    }
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
