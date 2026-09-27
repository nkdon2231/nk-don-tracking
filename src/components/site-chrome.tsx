import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/constants";
import { PUBLIC_LINKS } from "@/lib/site-content";
import { SiteNav } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[color:rgba(244,239,230,0.94)] backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="no-underline">
          <span className="serif block text-xl leading-none tracking-tight">{BRAND.short}</span>
          <span className="mt-1 hidden text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-muted)] sm:block">Global Logistics</span>
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-[var(--color-line)] bg-[#ebe4d8]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="serif text-2xl text-[var(--color-ink)]">{BRAND.name}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">{BRAND.tagline}</p>
        </div>
        <nav className="grid content-start gap-2 text-sm" aria-label="Footer">
          {PUBLIC_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="no-underline">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="grid content-start gap-2 text-sm">
          <Link href="/track" className="font-semibold no-underline">
            Track a shipment
          </Link>
          <Link href="/contact" className="no-underline">
            Request a movement
          </Link>
          <Link href="/admin/login" className="no-underline">
            Staff sign in
          </Link>
        </div>
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
