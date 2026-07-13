import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { createClient } from "@/lib/supabase/server";

export default async function PrivacyPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) redirect("/login?next=/settings/privacy");

  const db = supabase as any;
  const { data: preferences } = await db
    .from("privacy_preferences")
    .select("ai_personalization_enabled, model_improvement_opt_in, cookie_preference")
    .eq("user_id", user.id)
    .maybeSingle();

  const controls = [
    ["AI personalization", "Use private progress and lesson history to recommend lessons and practice.", preferences?.ai_personalization_enabled ? "On" : "Off"],
    ["Help improve LearnToCode Lab", "Allow anonymized learning interactions, mistakes, feedback ratings, and examples to improve educational systems.", preferences?.model_improvement_opt_in ? "On" : "Off"],
    ["Cookie and preference choices", "Store basic preferences needed for sign-in, accessibility, and learning continuity.", preferences?.cookie_preference ?? "essential"],
    ["Data export", "Request a copy of profile, progress, attempts, projects, and privacy settings.", "Planned"],
    ["Delete account", "Request deletion of account data and learning history.", "Available in settings"]
  ];

  return (
    <PageShell>
      <SectionHeader eyebrow="Privacy" title="Control your learning data." copy="Personalization and broader improvement permissions are separate, so learners can keep useful recommendations without giving up control." />

      <div className="grid gap-4">
        {controls.map(([title, copy, state]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lab">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <h2 className="text-xl font-black text-lab-navy">{title}</h2>
                <p className="mt-2 text-slate-600">{copy}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black uppercase text-slate-600">{state}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lab">
        <h2 className="text-2xl font-black text-lab-navy">Legal documents</h2>
        <p className="mt-2 text-slate-600">The public Terms of Service and Privacy Policy explain what these controls mean in plain language.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/privacy" className="rounded-xl border border-slate-200 px-4 py-3 font-black text-lab-navy hover:border-lab-blue hover:text-lab-blue">
            Read Privacy Policy
          </Link>
          <Link href="/terms" className="rounded-xl border border-slate-200 px-4 py-3 font-black text-lab-navy hover:border-lab-blue hover:text-lab-blue">
            Read Terms
          </Link>
          <Link href="/settings" className="rounded-xl bg-lab-navy px-4 py-3 font-black text-white">
            Edit privacy settings
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
