import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/OnboardingForm";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) redirect("/login?next=/onboarding");

  return (
    <PageShell>
      <SectionHeader eyebrow="First-time setup" title="Build your learning profile." copy="Set your starting point, goals, preferences, and placement signal so LearnToCode Lab can recommend the right path." />
      <OnboardingForm />
    </PageShell>
  );
}
