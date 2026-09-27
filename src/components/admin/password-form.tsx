"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/client-api";
import { AuthSplit } from "./login-form";
import { Banner, PASSWORD_HINT } from "./ui";

export function PasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (next !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await api("/api/admin/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: form.get("currentPassword"), password: next }),
      });
      router.replace("/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The password could not be changed.");
      setPending(false);
    }
  }

  return (
    <AuthSplit
      title="Replace the temporary password"
      lede="This desk stays closed until the temporary password is replaced. The new password is stored only as a hash."
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <p className="text-sm text-[var(--color-muted)]">
          Signed in as <span className="font-medium">{email}</span>
        </p>
        <label className="field">
          <span>Temporary password</span>
          <input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} />
        </label>
        <label className="field">
          <span>New password</span>
          <input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} />
        </label>
        <label className="field">
          <span>Confirm new password</span>
          <input name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={128} />
        </label>
        <p className="text-xs leading-5 text-[var(--color-muted)]">{PASSWORD_HINT}</p>
        {error ? <Banner>{error}</Banner> : null}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save password and open the desk"}
        </button>
      </form>
    </AuthSplit>
  );
}
