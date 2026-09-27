import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/constants";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/tracking", label: "Track" },
  { href: "/services", label: "Services" },
  { href: "/rates", label: "Rates" },
  { href: "/book", label: "Book" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <span className="brand-mark block text-lg font-black tracking-[0.18em]">{BRAND.short}</span>
          <span className="block text-[10px] uppercase tracking-[0.22em] text-white/55">Global Logistics</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm ${
                current === item.href ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/tracking" className="rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-ink">
            Track shipment
          </Link>
          <Link href="/admin/login" className="hidden rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 sm:inline">
            Operations
          </Link>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 py-2 lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
              current === item.href ? "bg-white text-ink" : "text-white/75"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-ink text-white/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="brand-mark text-lg font-black text-white">{BRAND.short}</div>
          <p className="mt-3 max-w-sm text-sm leading-6">{BRAND.tagline}</p>
        </div>
        <div className="text-sm">
          <div className="font-semibold text-white">Network</div>
          <p className="mt-3 leading-6">Freight, courier, warehousing, and consignment control across origin, transit, and last-mile facilities.</p>
        </div>
        <div className="text-sm">
          <div className="font-semibold text-white">Customer desk</div>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/tracking" className="hover:text-white">Track a shipment</Link>
            <Link href="/book" className="hover:text-white">Request pickup</Link>
            <Link href="/contact" className="hover:text-white">Contact operations</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/45">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </div>
    </footer>
  );
}

export function PublicShell({ current, children }: { current?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader current={current} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
