import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MaintenanceExperience } from "@/components/maintenance/MaintenanceExperience";
import { defaultMaintenanceSettings, type MaintenanceState } from "@/lib/maintenance";
import { requireAdmin } from "@/lib/maintenance-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Maintenance Preview | LearnToCode Lab", robots: { index: false, follow: false } };

export default async function MaintenancePreviewPage() {
  const admin = await requireAdmin();
  if (!admin.user) redirect("/login?next=/admin/maintenance/preview");
  if (!admin.authorized || !admin.supabase) redirect("/dashboard");
  const db = admin.supabase as any;
  const [{ data: settings }, { data: tasks }, { data: updates }] = await Promise.all([
    db.from("site_settings").select("maintenance_enabled,maintenance_title,maintenance_message,maintenance_status,maintenance_badge_text,estimated_return_at,show_countdown,show_progress,progress_percent,allow_admin_bypass,allow_authenticated_users,allow_login_during_maintenance,show_personalized_message,show_saved_progress_message,auto_refresh_enabled,auto_refresh_interval_seconds,support_message,contact_email,updated_at").eq("id", "global").maybeSingle(),
    db.from("maintenance_tasks").select("id,title,description,status,progress_percent,display_order,visible").eq("visible", true).order("display_order"),
    db.from("maintenance_updates").select("id,title,message,published_at,visible").eq("visible", true).order("published_at", { ascending: false })
  ]);
  const state: MaintenanceState = { settings: { ...defaultMaintenanceSettings, ...(settings ?? {}), maintenance_enabled: true }, tasks: tasks ?? [], updates: updates ?? [], emergency: false, available: true };
  return <MaintenanceExperience state={state} returnTo="/admin/maintenance" profile={admin.profile ? { displayName: admin.profile.display_name, preferredLanguage: admin.profile.preferred_language } : null} preview />;
}
