"use client";

import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const next = params.get("next") || "/admin/dashboard";
      router.replace(next.startsWith("/admin") ? next : "/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-line bg-white p-7 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-steel">Operations desk</p>
      <h1 className="mt-2 text-3xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-steel">Administrator access uses the server session cookie. There is no client-side password store.</p>
      <label className="mt-6 block text-sm font-medium">
        Email
        <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3" />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Password
        <input name="password" type="password" required className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-3" />
      </label>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <button disabled={busy} className="mt-6 w-full rounded-xl bg-ink py-3 font-semibold text-white disabled:opacity-60">
        {busy ? "Checking…" : "Continue"}
      </button>
      <p className="mt-4 text-center text-xs text-steel">
        First administrator?{" "}
        <Link href="/admin/setup" className="underline">
          Open setup
        </Link>
      </p>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
