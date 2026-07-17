import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { resolveAccountIdentity } from "@/lib/identity";
import { requireAdmin } from "@/lib/maintenance-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin.user) redirect("/staff/sign-in?next=/admin");
  if (!admin.authorized) redirect("/dashboard");
  const identity = resolveAccountIdentity(admin.user, admin.profile);
  return <AdminShell user={{ id: admin.user.id, identity, role: admin.role || "admin" }}>{children}</AdminShell>;
}
