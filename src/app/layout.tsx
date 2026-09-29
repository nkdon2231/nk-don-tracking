import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit, Sora } from "next/font/google";
import { BRAND } from "@/lib/constants";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-outfit", weight: ["400", "500", "600", "700"] });
const display = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["500", "600", "700"] });

const FALLBACK_SITE = "https://nk-don-tracking.vercel.app";

function metadataBaseUrl() {
  const fallback = new URL(FALLBACK_SITE);
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return fallback;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return fallback;
    if (!url.hostname.includes(".")) return fallback;
    return url;
  } catch {
    // A future domain that is not a valid URL must not stop the production build.
    return fallback;
  }
}

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: { default: `${BRAND.legal}`, template: `%s · ${BRAND.short}` },
  description: "QCORVAZENT is an international courier and express desk shipping from Dubai. Follow a shipment with the tracking number staff issued.",
  applicationName: BRAND.name,
  openGraph: {
    title: BRAND.legal,
    description: "International courier and express from Dubai. Tracking shows recorded events, not a live position.",
    siteName: BRAND.name,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${sans.variable} ${display.variable}`}>
        {children}
      </body>
    </html>
  );
}