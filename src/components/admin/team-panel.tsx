"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can, ROLE_LABEL, ROLES, type Role } from "@/lib/constants";
import { formatWhen } from "@/lib/format";
import { AdminFrame, useStaff } from "./shell";
import type { Staff } from "./types";
import { Banner, PASSWORD_HINT } from "./ui";

type Member = Staff & { lastLoginAt: string | null; createdAt: string | null };

export function TeamPanel() {
  return (
    <AdminFrame>
      <TeamBody />
    </AdminFrame>
  );
}

function TeamBody() {
  const session = useStaff();
  const [items, setItems] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const result = await api<{ items: Member[] }>("/api/admin/users");
    setItems(result.items);
  }

  useEffect(() => {
    if (!can(session.user.role, "users:write")) return;
    load().catch((caught) => setError(caught instanceof ApiError ? caught.message : "The team could not be loaded."));
  }, [session.user.role]);

  if (!can(session.user.role, "users:write")) {
    return <Banner>Only a super admin can manage the team.</Banner>;
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
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
      setNotice("Staff account created. They can sign in with that email and password.");
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The account could not be created.");
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <div>
        <h1 className="serif text-4xl">Team</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Roles decide who can book shipments, add events, publish evidence, and change settings. At least one active super admin must remain.
        </p>
      </div>
      {notice ? <Banner tone="ok">{notice}</Banner> : null}
      {error ? <Banner>{error}</Banner> : null}
      <div className="grid gap-3">
        {items.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            onSaved={async (message) => {
              setNotice(message);
              await load();
            }}
            onError={setError}
          />
        ))}
      </div>
      <form className="card grid gap-3 p-5" onSubmit={create}>
        <h2 className="serif text-2xl">Add a staff account</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field">
            <span>Name</span>
            <input name="name" required maxLength={120} />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required maxLength={200} />
          </label>
          <label className="field">
            <span>Role</span>
            <select name="role" defaultValue="operations">
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Temporary password</span>
            <input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
          </label>
        </div>
        <p className="text-xs text-[var(--color-muted)]">{PASSWORD_HINT}</p>
        <button className="btn btn-primary w-fit" type="submit">
          Create account
        </button>
      </form>
    </div>
  );
}

function MemberRow({
  member,
  onSaved,
  onError,
}: {
  member: Member;
  onSaved: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const payload: { name: string; role: Role; isActive: boolean; password?: string } = {
      name: String(form.get("name") ?? ""),
      role: String(form.get("role") ?? member.role) as Role,
      isActive: form.get("isActive") === "on",
    };
    if (password) payload.password = password;
    try {
      await api(`/api/admin/users/${member.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      setOpen(false);
      await onSaved(password ? "Account updated and existing sessions signed out." : "Account updated.");
    } catch (caught) {
      onError(caught instanceof ApiError ? caught.message : "The account could not be updated.");
    }
  }

  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {member.name} {!member.isActive ? <span className="badge badge-muted">Inactive</span> : null}
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            {member.email} · {ROLE_LABEL[member.role]} · {member.authProvider === "supabase" ? "Supabase Auth" : "Desk password"} · Last sign-in {formatWhen(member.lastLoginAt, true)}
          </p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => setOpen((value) => !value)}>
          {open ? "Close" : "Edit"}
        </button>
      </div>
      {open ? (
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={save}>
          <label className="field">
            <span>Name</span>
            <input name="name" required defaultValue={member.name} maxLength={120} />
          </label>
          <label className="field">
            <span>Role</span>
            <select name="role" defaultValue={member.role}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>New password</span>
            <input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" placeholder="Leave blank to keep" />
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked={member.isActive} />
            Active
          </label>
          <button className="btn btn-primary w-fit" type="submit">
            Save account
          </button>
        </form>
      ) : null}
    </article>
  );
}
