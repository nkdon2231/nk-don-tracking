"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { formatWhen } from "@/lib/format";
import { AdminFrame } from "./shell";
import { Banner, Empty } from "./ui";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  notificationStatus: string;
  createdAt: string | null;
};

export function MessagesPanel() {
  return (
    <AdminFrame>
      <MessagesBody />
    </AdminFrame>
  );
}

function MessagesBody() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ items: Inquiry[] }>("/api/admin/inquiries")
      .then((result) => setItems(result.items))
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Messages could not be loaded."));
  }, []);

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <div>
        <h1 className="serif text-4xl">Messages</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          These were submitted on the public contact form. Email is not sent until a provider is connected, so nothing here has gone out automatically.
        </p>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {items.length === 0 && !error ? <Empty title="No messages" /> : null}
      {items.map((item) => (
        <article key={item.id} className="card p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">{formatWhen(item.createdAt, true)}</p>
          <h2 className="mt-1 text-xl font-semibold">{item.topic || "General"}</h2>
          <p className="mt-1 text-sm">
            {item.name} · {item.email}
            {item.phone ? ` · ${item.phone}` : ""}
          </p>
          <p className="mt-3 whitespace-pre-wrap leading-7">{item.message}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[var(--color-copper)]">
            {item.notificationStatus === "not_configured" ? "Email not configured" : item.notificationStatus}
          </p>
        </article>
      ))}
    </div>
  );
}
