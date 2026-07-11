import Link from "next/link";
import { PageShell, SectionHeader } from "@/components/PageShell";

export default function SettingsPage() {
  return (
    <PageShell>
      <SectionHeader eyebrow="Settings" title="Tune your learning system." copy="Learning, editor, accessibility, and privacy settings are separated so the platform can grow without crowding one panel." />
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Learning settings", "Lesson pace, explanation detail, difficulty, timers, hint behavior."],
          ["Editor settings", "Theme, font size, tab size, autosave, autocomplete, live preview."],
          ["Accessibility", "Keyboard navigation, high contrast, reduced motion, spacing, captions."],
          ["Privacy and data", "Export data, delete account, AI personalization, model-improvement permission."]
        ].map(([title, copy]) => (
          <div key={title} className="glass rounded-3xl p-6">
            <h2 className="text-2xl font-black text-lab-navy">{title}</h2>
            <p className="mt-3 text-slate-600">{copy}</p>
          </div>
        ))}
      </div>
      <Link href="/settings/privacy" className="mt-5 inline-flex rounded-xl bg-lab-navy px-4 py-3 font-black text-white">Open privacy controls</Link>
    </PageShell>
  );
}
