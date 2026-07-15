import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/maintenance-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin.user) redirect("/staff/sign-in?next=/admin");
  if (!admin.authorized) redirect("/dashboard");
  return <AdminShell user={{ label: admin.profile?.display_name || admin.user.email || "Administrator", email: admin.user.email || "", role: admin.role || "admin" }}>{children}</AdminShell>;
}
