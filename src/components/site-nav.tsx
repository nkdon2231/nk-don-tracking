"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PUBLIC_LINKS } from "@/lib/site-content";

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="hidden items-center gap-5 text-sm md:flex" aria-label="Primary">
        {PUBLIC_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active(pathname, link.href) ? "page" : undefined}
            className={`no-underline ${active(pathname, link.href) ? "font-semibold text-[var(--color-copper)]" : "text-[var(--color-ink)]"}`}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/admin" className="btn btn-ghost !px-3 !py-1.5 text-sm">
          Staff
        </Link>
      </nav>
      <button
        type="button"
        className="btn btn-ghost !px-3 !py-2 text-sm md:hidden"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Menu"}
      </button>
      {open ? (
        <nav id="site-menu" className="absolute inset-x-0 top-full border-b border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="mx-auto grid max-w-6xl gap-1">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-3 no-underline ${active(pathname, link.href) ? "bg-white font-semibold" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/admin" className="rounded-xl px-3 py-3 no-underline">
              Staff desk
            </Link>
          </div>
        </nav>
      ) : null}
    </>
  );
}
