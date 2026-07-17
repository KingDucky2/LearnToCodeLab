import { MaintenanceAdminForm } from "@/components/admin/MaintenanceAdminForm";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { defaultMaintenanceSettings } from "@/lib/maintenance";
import { requireAdmin } from "@/lib/maintenance-server";

export const dynamic = "force-dynamic";

export default async function AdminMaintenancePage() {
  const admin = await requireAdmin();
  if (!admin.supabase) return null;
  const db = admin.supabase as any;
  const [{ data: settings }, { data: tasks }, { data: updates }] = await Promise.all([
    db.from("site_settings").select("maintenance_enabled,maintenance_title,maintenance_message,maintenance_status,maintenance_badge_text,estimated_return_at,show_countdown,show_progress,progress_percent,allow_admin_bypass,allow_authenticated_users,allow_login_during_maintenance,show_personalized_message,show_saved_progress_message,auto_refresh_enabled,auto_refresh_interval_seconds,support_message,contact_email,updated_at,updated_by").eq("id", "global").maybeSingle(),
    db.from("maintenance_tasks").select("id,title,description,status,progress_percent,display_order,visible").order("display_order"),
    db.from("maintenance_updates").select("id,title,message,published_at,visible").order("published_at", { ascending: false })
  ]);
  let updater: string | null = null;
  if (settings?.updated_by) { const { data } = await db.from("profiles").select("display_name,username").eq("id", settings.updated_by).maybeSingle(); updater = data?.display_name ?? data?.username ?? null; }
  return <><AdminPageHeader title="Maintenance" description="Publish a clear visitor notice in a few steps, with advanced controls available when you need them." /><MaintenanceAdminForm initialSettings={{ ...defaultMaintenanceSettings, ...(settings ?? {}) }} initialTasks={tasks ?? []} initialUpdates={updates ?? []} lastUpdatedBy={updater} /></>;
}
