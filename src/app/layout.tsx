import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit, Sora } from "next/font/google";
import { BRAND } from "@/lib/constants";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-outfit", weight: ["400", "500", "600", "700"] });
const display = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.short}` },
  description: "Courier, freight, and consignment tracking from NKDON Global Logistics.",
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