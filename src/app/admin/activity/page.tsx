"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { formatDateTime } from "@/lib/format";

type Item = {
  id: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  ip: string;
  createdAt: string | null;
};

export default function ActivityPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ items: Item[] }>("/api/admin/activity")
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Audit log</h1>
      {error ? <p className="text-red-700">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cream text-xs uppercase text-steel">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3 text-steel">{formatDateTime(item.createdAt)}</td>
                <td className="px-4 py-3">{item.actorEmail || "—"}</td>
                <td className="px-4 py-3">{item.action}</td>
                <td className="px-4 py-3">
                  {item.resource}
                  {item.resourceId ? ` · ${item.resourceId.slice(0, 8)}` : ""}
                </td>
                <td className="px-4 py-3 text-steel">{item.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
