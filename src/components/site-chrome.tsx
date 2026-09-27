import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/constants";

const links = [
  { href: "/track", label: "Track" },
  { href: "/#services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[color:rgba(244,239,230,0.9)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="no-underline">
          <span className="serif block text-xl tracking-tight">{BRAND.short}</span>
          <span className="block text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-muted)]">Global Logistics</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-[var(--color-ink)] no-underline">
              {link.label}
            </Link>
          ))}
          <Link href="/admin" className="btn btn-ghost !px-3 !py-1.5 text-sm">
            Staff
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-line)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-[var(--color-muted)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="serif text-lg text-[var(--color-ink)]">{BRAND.name}</p>
          <p>{BRAND.tagline}</p>
        </div>
        <p>Public tracking shows only the details operations has marked for the customer.</p>
      </div>
    </footer>
  );
}

export function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
