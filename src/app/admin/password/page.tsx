import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/admin/password-form";
import { currentUser } from "@/lib/auth";
import { ensureReady } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Change password" };

export default async function PasswordPage() {
  await ensureReady();
  const user = await currentUser();
  if (!user) redirect("/admin/login?next=/admin/password");
  if (!user.mustChangePassword) redirect("/admin");
  return <PasswordForm email={user.email} />;
}
