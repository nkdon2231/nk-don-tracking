import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Outfit } from "next/font/google";
import { BRAND } from "@/lib/constants";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.short}` },
  description: "Shipment, freight, courier, and consignment tracking for NKDON Global Logistics.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`} style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
        <style>{`.serif{font-family:var(--font-fraunces),Fraunces,serif}`}</style>
        {children}
      </body>
    </html>
  );
}
