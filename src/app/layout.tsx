import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bodoni_Moda, Outfit, Sora } from "next/font/google";
import { BRAND } from "@/lib/constants";
import { googleSiteVerification, publicOrigin } from "@/lib/site-url";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-outfit", weight: ["400", "500", "600", "700"] });
const display = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["500", "600", "700"] });
const wordmark = Bodoni_Moda({ subsets: ["latin"], variable: "--font-wordmark", weight: ["400", "500", "600"] });

const google = googleSiteVerification();

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin()),
  title: { default: BRAND.legal, template: `%s · ${BRAND.short}` },
  description: "QCORVAZENT is an international courier and express desk shipping from Dubai. Follow a shipment with the tracking number staff issued.",
  applicationName: BRAND.name,
  robots: { index: true, follow: true },
  ...(google ? { verification: { google } } : {}),
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
      <body className={`${sans.variable} ${display.variable} ${wordmark.variable}`}>
        {children}
      </body>
    </html>
  );
}
