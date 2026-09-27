"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { AuthSplit } from "./login-form";
import { Banner, PASSWORD_HINT } from "./ui";

export function SetupForm() {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
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
      setDone(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Setup could not be completed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthSplit
      title="Create the first administrator"
      lede="This page works only while the staff list is empty. It asks for the setup token already stored on the server. It does not invent a password."
    >
      {done ? (
        <div className="grid gap-4">
          <Banner tone="ok">The super admin account is ready. Sign in with the email and password you just chose.</Banner>
          <Link className="btn btn-primary" href="/admin/login">
            Go to sign in
          </Link>
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={onSubmit}>
          <label className="field">
            <span>Setup token</span>
            <input name="token" type="password" autoComplete="off" required minLength={16} maxLength={200} />
          </label>
          <label className="field">
            <span>Your name</span>
            <input name="name" required maxLength={120} autoComplete="name" />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required maxLength={200} autoComplete="username" />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
          </label>
          <p className="text-xs leading-5 text-[var(--color-muted)]">{PASSWORD_HINT}</p>
          {error ? <Banner>{error}</Banner> : null}
          <button className="btn btn-copper" type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create super admin"}
          </button>
          <Link href="/admin/login" className="text-sm">
            I already have an account
          </Link>
        </form>
      )}
    </AuthSplit>
  );
}
