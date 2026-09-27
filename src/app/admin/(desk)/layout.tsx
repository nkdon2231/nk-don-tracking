import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ensureReady } from "@/lib/db";
import { HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";

export default async function DeskLayout({ children }: { children: ReactNode }) {
  try {
    await ensureReady();
    const user = await currentUser();
    if (!user) redirect("/admin/login?reason=expired");
    if (user.mustChangePassword) redirect("/admin/password");
  } catch (error) {
    if (error instanceof HttpError) {
      return (
        <main className="mx-auto max-w-lg px-6 py-20">
          <h1 className="serif text-4xl">The desk is not connected</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{error.message}</p>
        </main>
      );
    }
    throw error;
  }
  return children;
}
