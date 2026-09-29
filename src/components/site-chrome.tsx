import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND, SUPPORT_EMAIL } from "@/lib/constants";
import { FOOTER_LINKS } from "@/lib/site-content";
import { BrandLockup } from "./brand-mark";
import { SiteHeader } from "./site-nav";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#060d14]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandLockup />
          <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--color-muted)]">{BRAND.tagline}</p>
        </div>
        <nav className="grid content-start gap-2 text-sm" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-[var(--color-ink)]/85 no-underline hover:text-[var(--color-copper)]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="grid content-start gap-2 text-sm">
          <Link href="/track" className="font-semibold text-[var(--color-copper)] no-underline">
            Track a shipment
          </Link>
          <Link href="/quote" className="no-underline">
            Get a quote
          </Link>
          <Link href="/book" className="no-underline">
            Request a pickup
          </Link>
          <Link href="/admin/login" className="text-white/70 no-underline">
            Staff sign in
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-white/45">Customer Support</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-semibold text-[var(--color-copper)] no-underline">
            {SUPPORT_EMAIL}
          </a>
          <p className="text-xs leading-5 text-white/45">Shown for customers. Mail is not sent automatically.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs tracking-[0.14em] text-white/45 uppercase">{BRAND.legal}</p>
      </div>
    </footer>
  );
}

export function PublicFrame({ children, hero = false }: { children: ReactNode; hero?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader overlay={hero} />
      <main className={hero ? "flex-1" : "flex-1 pt-[4.5rem]"}>{children}</main>
      <SiteFooter />
    </div>
  );
}
