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
  const [{ data: settings }, { data: tasks }, { data: updates }, { data: profile }] = await Promise.all([
    db.from("site_settings").select("*").eq("id", "global").maybeSingle(),
    db.from("maintenance_tasks").select("id,title,description,status,progress_percent,display_order,visible").eq("visible", true).order("display_order"),
    db.from("maintenance_updates").select("id,title,message,published_at,visible").eq("visible", true).order("published_at", { ascending: false }),
    db.from("profiles").select("display_name,preferred_language").eq("id", admin.user.id).maybeSingle()
  ]);
  const state: MaintenanceState = { settings: { ...defaultMaintenanceSettings, ...(settings ?? {}), maintenance_enabled: true }, tasks: tasks ?? [], updates: updates ?? [], emergency: false, available: true };
  return <MaintenanceExperience state={state} returnTo="/admin/maintenance" profile={profile ? { displayName: profile.display_name, preferredLanguage: profile.preferred_language } : null} preview />;
}
