import type { ReactNode } from "react";

export const metadata = {
  title: "Staff desk",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
