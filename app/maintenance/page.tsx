import type { Metadata } from "next";
import { MaintenanceExperience } from "@/components/maintenance/MaintenanceExperience";
import { safeMaintenanceReturnPath } from "@/lib/maintenance";
import { getCurrentUserRole, getPublicMaintenanceState } from "@/lib/maintenance-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maintenance | LearnToCode Lab",
  description: "LearnToCode Lab is temporarily unavailable while platform improvements are installed.",
  robots: { index: false, follow: false }
};

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const [{ returnTo }, state, session] = await Promise.all([searchParams, getPublicMaintenanceState(), getCurrentUserRole()]);
  let profile: { displayName: string | null; preferredLanguage: string | null } | null = null;
  if (session.user && session.supabase && state.settings.show_personalized_message) {
    const db = session.supabase as any;
    const { data } = await db.from("profiles").select("display_name, preferred_language").eq("id", session.user.id).maybeSingle();
    profile = data ? { displayName: data.display_name, preferredLanguage: data.preferred_language } : null;
  }
  return <MaintenanceExperience state={state} returnTo={safeMaintenanceReturnPath(returnTo)} profile={profile} />;
}
