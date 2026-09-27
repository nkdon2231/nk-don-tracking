"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/client";

export default function AdminSetupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/admin/setup", {
        method: "POST",
        body: JSON.stringify({
          token: form.get("token"),
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      router.replace("/admin/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Setup could not complete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-line bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-steel">First administrator</p>
        <h1 className="mt-2 text-3xl font-semibold">Setup</h1>
        <p className="mt-2 text-sm text-steel">
          This route works only while no administrator exists. It requires the server SETUP_TOKEN and never shows that value.
        </p>
        <label className="mt-6 block text-sm font-medium">
          Setup token
          <input name="token" required minLength={16} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3" />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Name
          <input name="name" required className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3" />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3" />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input name="password" type="password" required minLength={12} className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3" />
        </label>
        <p className="mt-2 text-xs text-steel">At least 12 characters, with upper, lower, and a number.</p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <button disabled={busy} className="mt-6 w-full rounded-xl bg-ink py-3 font-semibold text-white disabled:opacity-60">
          {busy ? "Creating…" : "Create super admin"}
        </button>
        <p className="mt-4 text-center text-xs text-steel">
          Already set up? <Link href="/admin/login" className="underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
