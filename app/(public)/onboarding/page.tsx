import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/OnboardingForm";
import { createClient } from "@/lib/supabase/server";
import { resolveAccountIdentity } from "@/lib/identity";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) redirect("/login?next=/onboarding");
  const db = supabase as any;
  const { data: profile } = await db.from("profiles").select("display_name,username,avatar_url,avatar_source,onboarding_completed,onboarding_required").eq("id", user.id).maybeSingle();
  if (profile?.onboarding_completed && !profile?.onboarding_required) redirect("/dashboard");
  const identity = resolveAccountIdentity(user, profile);

  return (
    <main data-onboarding-page className="onboarding-page px-3 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 max-w-3xl sm:mb-8">
          <p className="text-xs font-black uppercase text-cyan-300">First-time setup</p>
          <h1 className="mt-2 text-4xl font-black leading-[1.05] text-white sm:text-5xl">Build your learning profile.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Set your starting point, goals, preferences, and placement signal so LearnToCode Lab can recommend the right path.</p>
        </header>
        <OnboardingForm identity={identity} profile={{ display_name: profile?.display_name ?? null, username: profile?.username ?? null, avatar_url: profile?.avatar_source === "custom" ? profile.avatar_url : null }} />
      </div>
    </main>
  );
}
