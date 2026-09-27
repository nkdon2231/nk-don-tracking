"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { api, type SessionUser } from "@/lib/client";
import { can, ROLE_LABEL, type Action } from "@/lib/constants";

const LINKS: { href: string; label: string; action?: Action }[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/shipments", label: "Shipments" },
  { href: "/admin/evidence", label: "Evidence" },
  { href: "/admin/facilities", label: "Facilities" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/users", label: "Users", action: "users:write" },
  { href: "/admin/settings", label: "Settings", action: "settings:write" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ user: SessionUser | null }>("/api/admin/auth/session")
      .then((payload) => {
        if (!payload.user) {
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        setUser(payload.user);
      })
      .catch(() => router.replace("/admin/login"))
      .finally(() => setReady(true));
  }, [pathname, router]);

  async function logout() {
    await api("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (!ready || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-paper text-steel">Loading operations desk…</div>;
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin/dashboard" className="font-black tracking-[0.16em]">
            NKDON DESK
          </Link>
          <div className="flex items-center gap-3 text-sm text-white/70">
            <span>
              {user.name} · {ROLE_LABEL[user.role]}
            </span>
            <Link href="/" className="hidden sm:inline hover:text-white">
              Public site
            </Link>
            <button onClick={logout} className="rounded-lg border border-white/20 px-3 py-1.5 text-white">
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-3">
          {LINKS.filter((link) => !link.action || can(user.role, link.action)).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                pathname.startsWith(link.href) ? "bg-white text-ink" : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </div>
  );
}
