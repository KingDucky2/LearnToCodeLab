import { redirect } from "next/navigation";
import { MaintenanceAdminForm } from "@/components/admin/MaintenanceAdminForm";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { defaultMaintenanceSettings } from "@/lib/maintenance";
import { requireAdmin } from "@/lib/maintenance-server";

export const dynamic = "force-dynamic";

export default async function AdminMaintenancePage() {
  const admin = await requireAdmin();
  if (!admin.user) redirect("/login?next=/admin/maintenance");
  if (!admin.authorized || !admin.supabase) redirect("/dashboard");
  const db = admin.supabase as any;
  const [{ data: settings }, { data: tasks }, { data: updates }] = await Promise.all([
    db.from("site_settings").select("*").eq("id", "global").maybeSingle(),
    db.from("maintenance_tasks").select("id,title,description,status,progress_percent,display_order,visible").order("display_order"),
    db.from("maintenance_updates").select("id,title,message,published_at,visible").order("published_at", { ascending: false })
  ]);
  let updater: string | null = null;
  if (settings?.updated_by) { const { data } = await db.from("profiles").select("display_name,username").eq("id", settings.updated_by).maybeSingle(); updater = data?.display_name ?? data?.username ?? null; }
  return <PageShell><SectionHeader eyebrow="Admin / Maintenance" title="Control site availability." copy="Publish maintenance messages, track work, preview the visitor experience, and reopen the lab without a deployment." /><MaintenanceAdminForm initialSettings={{ ...defaultMaintenanceSettings, ...(settings ?? {}) }} initialTasks={tasks ?? []} initialUpdates={updates ?? []} lastUpdatedBy={updater} /></PageShell>;
}
