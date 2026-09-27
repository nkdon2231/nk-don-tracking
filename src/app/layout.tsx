import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: BRAND.name,
    template: `%s · ${BRAND.short}`,
  },
  description: "International freight, courier, warehousing, consignment control, and live shipment tracking.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
