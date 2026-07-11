import { OnboardingForm } from "@/components/OnboardingForm";
import { PageShell, SectionHeader } from "@/components/PageShell";

export default function OnboardingPage() {
  return (
    <PageShell>
      <SectionHeader eyebrow="First-time setup" title="Build your learning profile." copy="Set your starting point, goals, preferences, and placement signal so LearnToCode Lab can recommend the right path." />
      <OnboardingForm />
    </PageShell>
  );
}
