import { LoginForm } from "@/components/admin/login-form";

export const metadata = { title: "Staff sign in" };

function safeNext(next: string | undefined) {
  if (!next || !next.startsWith("/admin/") || next.startsWith("//") || next.includes("\\") || next.includes("%")) return "/admin";
  if (next.startsWith("/admin/login") || next.startsWith("/admin/setup")) return "/admin";
  return next;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const { next, reason } = await searchParams;
  const notice =
    reason === "expired"
      ? "That session is no longer valid. Sign in again."
      : reason === "signed-out"
        ? "You have signed out."
        : "";
  return <LoginForm nextPath={safeNext(next)} notice={notice} />;
}