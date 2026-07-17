import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { AccountSettingsForm } from "@/components/settings/AccountSettingsForm";
import { resolveAccountIdentity } from "@/lib/identity";
import { getCurrentUserRole } from "@/lib/maintenance-server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getCurrentUserRole();
  if (!session.user || !session.supabase) redirect("/login?next=/settings");

  const db = session.supabase as any;
  const [{ data: profile }, { data: preferences }, { data: learningPreferences }] = await Promise.all([
    db.from("profiles").select("experience_level,learning_goal").eq("id", session.user.id).maybeSingle(),
    db.from("privacy_preferences").select("ai_personalization_enabled,model_improvement_opt_in,cookie_preference").eq("user_id", session.user.id).maybeSingle(),
    db.from("learning_preferences").select("theme,reduced_motion,lesson_difficulty,explanation_style").eq("user_id", session.user.id).maybeSingle()
  ]);
  const identity = resolveAccountIdentity(session.user, session.profile);

  return (
    <PageShell>
      <SectionHeader eyebrow="Settings" title="Tune your learning system." copy="Manage security, preferences, privacy choices, and account safety from one clean place." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <AccountSettingsForm identity={identity} role={session.role ?? "learner"} profile={{ ...profile, preferred_language: session.profile?.preferred_language ?? null }} preferences={preferences} learningPreferences={learningPreferences} />
        <aside className="h-fit surface-panel">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-amber-100 text-amber-800">
            <FileText aria-hidden="true" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-2xl font-black text-foreground">Legal</h2>
          <p className="mt-2 text-muted">Read the Terms of Service and Privacy Policy for LearnToCode Lab.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/terms" className="btn-outline hover:border-lab-blue hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="btn-outline hover:border-lab-blue hover:text-primary">
              Privacy
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
