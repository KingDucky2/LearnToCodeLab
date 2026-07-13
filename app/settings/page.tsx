import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { AccountSettingsForm } from "@/components/settings/AccountSettingsForm";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) redirect("/login?next=/settings");

  const db = supabase as any;
  const [{ data: profile }, { data: preferences }, { data: learningPreferences }] = await Promise.all([
    db.from("profiles").select("preferred_language, experience_level, learning_goal").eq("id", user.id).maybeSingle(),
    db.from("privacy_preferences").select("ai_personalization_enabled, model_improvement_opt_in, cookie_preference").eq("user_id", user.id).maybeSingle(),
    db.from("learning_preferences").select("theme, reduced_motion, lesson_difficulty, explanation_style").eq("user_id", user.id).maybeSingle()
  ]);

  return (
    <PageShell>
      <SectionHeader eyebrow="Settings" title="Tune your learning system." copy="Manage security, preferences, privacy choices, and account safety from one clean place." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <AccountSettingsForm email={user.email ?? "No email on account"} provider={user.app_metadata?.provider ?? "email"} profile={profile} preferences={preferences} learningPreferences={learningPreferences} />
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-lab">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-800">
            <FileText aria-hidden="true" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-2xl font-black text-lab-navy">Legal</h2>
          <p className="mt-2 text-slate-600">Read the Terms of Service and Privacy Policy for LearnToCode Lab.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/terms" className="rounded-xl border border-slate-200 px-4 py-3 font-black text-lab-navy hover:border-lab-blue hover:text-lab-blue">
              Terms
            </Link>
            <Link href="/privacy" className="rounded-xl border border-slate-200 px-4 py-3 font-black text-lab-navy hover:border-lab-blue hover:text-lab-blue">
              Privacy
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
