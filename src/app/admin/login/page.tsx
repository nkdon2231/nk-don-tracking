import { LoginForm } from "@/components/admin/login-form";

export const metadata = { title: "Staff sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  return <LoginForm nextPath={nextPath} />;
}
