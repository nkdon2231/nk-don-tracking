"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { formatWhen } from "@/lib/format";
import { AdminFrame } from "./shell";
import { Banner, Empty } from "./ui";

type Activity = {
  id: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  createdAt: string | null;
  metadata: unknown;
};

export function ActivityPanel() {
  return (
    <AdminFrame>
      <ActivityBody />
    </AdminFrame>
  );
}

function ActivityBody() {
  const [items, setItems] = useState<Activity[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ items: Activity[] }>("/api/admin/activity")
      .then((result) => setItems(result.items))
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Activity could not be loaded."));
  }, []);

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <div>
        <h1 className="serif text-4xl">Activity</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Sign-ins, shipment changes, evidence, and settings. This log is not edited from the desk.</p>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {items.length === 0 && !error ? <Empty title="No activity yet" /> : null}
      <div className="grid gap-2">
        {items.map((item) => (
          <article key={item.id} className="card grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr]">
            <p className="text-sm text-[var(--color-muted)]">{formatWhen(item.createdAt, true)}</p>
            <p className="text-sm">
              <span className="font-semibold">{item.action.replaceAll("_", " ")}</span>
              <span className="text-[var(--color-muted)]">
                {" "}
                · {item.actorEmail || "system"} · {item.resource}
                {detail(item.metadata) ? ` · ${detail(item.metadata)}` : ""}
              </span>
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function detail(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "";
  const text = JSON.stringify(metadata);
  if (text === "{}") return "";
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}
