"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, type ReactNode } from "react";
import { ApiError, api } from "@/lib/client-api";
import { Banner } from "./ui";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      await api("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      router.replace(nextPath);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Sign-in failed.");
      setPending(false);
    }
  }

  return (
    <AuthSplit
      title="Staff sign in"
      lede="Use the administrator account created for this NKDON desk. There is no shared default password."
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="username" required maxLength={200} />
        </label>
        <label className="field">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required maxLength={128} />
        </label>
        {error ? <Banner>{error}</Banner> : null}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Checking…" : "Enter the desk"}
        </button>
        <p className="text-sm text-[var(--color-muted)]">
          First administrator? <Link href="/admin/setup">Open setup</Link> while no staff account exists.
        </p>
      </form>
    </AuthSplit>
  );
}

export function AuthSplit({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden min-h-screen lg:block">
        <img src="/images/control.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#142820] via-[#1d3b32]/55 to-[#1d3b32]/15" />
        <div className="absolute bottom-10 left-10 right-10 text-[var(--color-paper)]">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">NKDON Global Logistics</p>
          <p className="serif mt-2 text-5xl leading-none">The desk stays private.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-md">
          <Link href="/" className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)] no-underline">
            NKDON
          </Link>
          <h1 className="serif mt-3 text-4xl">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{lede}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
