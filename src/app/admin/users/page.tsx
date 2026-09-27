"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client";
import { ROLE_LABEL, ROLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

type User = { id: string; name: string; email: string; role: keyof typeof ROLE_LABEL; isActive: boolean; authProvider: string; lastLoginAt: string | null };

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setItems((await api<{ items: User[] }>("/api/admin/users")).items);
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          role: form.get("role"),
          password: form.get("password"),
          isActive: true,
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the user.");
    }
  }

  async function toggle(user: User) {
    try {
      await api(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !user.isActive }) });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the user.");
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Administrators</h1>
      <p className="text-sm text-steel">Accounts use the existing auth layer. When Supabase Auth is configured, the password is stored there.</p>
      {error ? <p className="text-red-700">{error}</p> : null}
      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-2">
        <input name="name" required placeholder="Name" className="field" />
        <input name="email" type="email" required placeholder="Email" className="field" />
        <select name="role" className="field" defaultValue="operations">{ROLES.map((role) => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}</select>
        <input name="password" type="password" required minLength={12} placeholder="Temporary password" className="field" />
        <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Add user</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cream text-xs uppercase text-steel"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3"></th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3"><div className="font-semibold">{item.name}</div><div className="text-xs text-steel">{item.email} · {item.authProvider}</div></td>
                <td className="px-4 py-3">{ROLE_LABEL[item.role]}</td>
                <td className="px-4 py-3 text-steel">{formatDateTime(item.lastLoginAt)}</td>
                <td className="px-4 py-3 text-right"><button className="underline" onClick={() => toggle(item)}>{item.isActive ? "Deactivate" : "Activate"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
