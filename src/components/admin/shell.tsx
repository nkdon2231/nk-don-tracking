"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, api } from "@/lib/client-api";
import { can, ROLE_LABEL, type Action } from "@/lib/constants";
import { BrandLockup } from "@/components/brand-mark";
import type { SessionInfo, Staff } from "./types";

const SessionContext = createContext<SessionInfo | null>(null);

export function useStaff() {
  const session = useContext(SessionContext);
  if (!session?.user) throw new Error("Staff session is not ready.");
  return session as SessionInfo & { user: Staff };
}

const NAV: { href: string; label: string; exact?: boolean; action?: Action }[] = [
  { href: "/admin", label: "Desk", exact: true },
  { href: "/admin/shipments", label: "Shipments" },
  { href: "/admin/facilities", label: "Facilities" },
  { href: "/admin/couriers", label: "Couriers" },
  { href: "/admin/evidence", label: "Evidence" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/team", label: "Team", action: "users:write" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    api<SessionInfo>("/api/admin/auth/session")
      .then((data) => {
        if (cancel) return;
        if (!data.user) {
          const params = new URLSearchParams({ reason: "expired" });
          if (pathname?.startsWith("/admin/") && !pathname.startsWith("/admin/login")) params.set("next", pathname);
          router.replace(`/admin/login?${params.toString()}`);
          return;
        }
        setSession(data);
      })
      .catch((caught) => {
        if (!cancel) setError(caught instanceof ApiError ? caught.message : "The desk could not be opened.");
      });
    return () => {
      cancel = true;
    };
  }, [pathname, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <p className="serif text-4xl">The desk is not connected</p>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{error}</p>
      </div>
    );
  }

  if (!session?.user) {
    return <p className="px-6 py-16 text-sm text-[var(--color-muted)]">Opening the desk…</p>;
  }

  const user = session.user;

  return (
    <SessionContext.Provider value={session}>
      <div className="min-h-screen bg-[var(--color-sand)] lg:pl-64">
        <aside className="border-b border-white/10 bg-[var(--color-pine)] text-[var(--color-paper)] lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex items-end justify-between px-4 py-4 lg:block">
            <Link href="/admin" className="no-underline">
              <BrandLockup subtitle="Operations" />
            </Link>
            <div className="flex items-center gap-3 lg:block">
              <Link href="/" className="text-xs text-white/70 no-underline lg:mt-4 lg:inline-block">
                Public site
              </Link>
              <div className="lg:hidden">
                <SignOut user={user} compact />
              </div>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3">
            {NAV.filter((item) => !item.action || can(user.role, item.action)).map((item) => {
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm no-underline whitespace-nowrap ${active ? "bg-white/15 text-white" : "text-white/75"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <SignOut user={user} />
        </aside>
        <div className="px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </div>
    </SessionContext.Provider>
  );
}

function SignOut({ user, compact = false }: { user: Staff; compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function leave() {
    setPending(true);
    try {
      await api("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login?reason=signed-out");
      router.refresh();
    }
  }

  if (compact) {
    return (
      <button className="text-xs text-white/80" type="button" disabled={pending} onClick={leave}>
        {pending ? "…" : "Sign out"}
      </button>
    );
  }

  return (
    <div className="hidden border-t border-white/10 px-4 py-4 lg:block">
      <p className="truncate text-sm font-semibold">{user.name}</p>
      <p className="truncate text-xs text-white/70">{user.email}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/60">{ROLE_LABEL[user.role]}</p>
      <button
        className="btn btn-ghost mt-3 !border-white/20 !px-3 !py-1.5 text-sm !text-white"
        type="button"
        disabled={pending}
        onClick={leave}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
