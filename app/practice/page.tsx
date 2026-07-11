import { PageShell, SectionHeader } from "@/components/PageShell";
import { PracticeEngine } from "@/components/PracticeEngine";

export default function PracticePage() {
  return (
    <PageShell>
      <SectionHeader eyebrow="Practice" title="Adaptive assessment and feedback." copy="This first implementation uses reusable seed questions and records the shape needed for attempts, mistakes, hints, and skill scores." />
      <PracticeEngine />
    </PageShell>
  );
}
