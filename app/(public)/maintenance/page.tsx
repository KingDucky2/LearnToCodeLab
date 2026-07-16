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

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<{ returnTo?: string; notice?: string }> }) {
  const [{ returnTo, notice }, state, session] = await Promise.all([searchParams, getPublicMaintenanceState(), getCurrentUserRole()]);
  let profile: { displayName: string | null; preferredLanguage: string | null } | null = null;
  if (session.user && session.profile && state.settings.show_personalized_message) {
    profile = { displayName: session.profile.display_name, preferredLanguage: session.profile.preferred_language };
  }
  return <MaintenanceExperience state={state} returnTo={safeMaintenanceReturnPath(returnTo)} profile={profile} notice={notice === "signed-in-access-restricted" ? notice : undefined} />;
}
