"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLockup } from "./brand-mark";
import { PUBLIC_LINKS } from "@/lib/site-content";

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open || !overlay;

  return (
    <header className={`site-header fixed inset-x-0 top-0 z-40 border-b border-transparent ${solid ? "is-solid" : ""}`}>
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="no-underline" aria-label="NKDON Global Logistics">
          <BrandLockup />
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Primary">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active(pathname, link.href) ? "page" : undefined}
              className={`no-underline transition-colors ${
                active(pathname, link.href) ? "font-semibold text-[var(--color-copper)]" : "text-[var(--color-ink)]/80 hover:text-[var(--color-ink)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/admin/login" className="text-sm text-white/60 no-underline hover:text-white">
            Staff
          </Link>
          <Link href="/track" className="btn btn-primary !px-4 !py-2 text-sm">
            Track
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/track" className="btn btn-primary !px-3 !py-2 text-sm">
            Track
          </Link>
          <button
            type="button"
            className="btn btn-ghost !px-3 !py-2 text-sm"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open ? (
        <nav id="site-menu" className="border-t border-white/10 bg-[#071018] px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="mx-auto grid max-w-6xl gap-1">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-3 no-underline ${active(pathname, link.href) ? "bg-white/10 font-semibold text-[var(--color-copper)]" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/faq" className="rounded-xl px-3 py-3 no-underline">
              FAQ
            </Link>
            <Link href="/admin/login" className="rounded-xl px-3 py-3 text-white/70 no-underline">
              Staff sign in
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
