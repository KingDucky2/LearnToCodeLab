import Link from "next/link";
import { BookOpenCheck, ExternalLink, FileText, LockKeyhole, Settings, SlidersHorizontal, UserRoundCog } from "lucide-react";
import { PageShell, SectionHeader } from "@/components/PageShell";

const settingGroups = [
  {
    title: "Learning settings",
    copy: "Lesson pace, explanation detail, difficulty, timers, and hint behavior.",
    icon: SlidersHorizontal
  },
  {
    title: "Profile and account",
    copy: "Username, avatar, email preferences, sign-in methods, and account requests.",
    icon: UserRoundCog
  },
  {
    title: "Lesson experience",
    copy: "Editor theme, font size, tab size, autosave, autocomplete, and live preview.",
    icon: BookOpenCheck
  },
  {
    title: "Accessibility",
    copy: "Keyboard navigation, high contrast, reduced motion, spacing, and captions.",
    icon: Settings
  }
];

export default function SettingsPage() {
  return (
    <PageShell>
      <SectionHeader eyebrow="Settings" title="Tune your learning system." copy="Manage learning preferences, account controls, privacy choices, and legal information from one clean place." />

      <div className="grid gap-4 md:grid-cols-2">
        {settingGroups.map(({ title, copy, icon: Icon }) => (
          <div key={title} className="glass rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lab-blue/10 text-lab-blue">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-lab-navy">{title}</h2>
                <p className="mt-2 text-slate-600">{copy}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lab">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lab-teal/15 text-lab-navy">
              <LockKeyhole aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-lab-navy">Privacy and data controls</h2>
              <p className="mt-2 text-slate-600">Review personalization, model-improvement choices, data export, and account deletion requests.</p>
              <Link href="/settings/privacy" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lab-navy px-4 py-3 font-black text-white">
                Open privacy controls
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lab">
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
        </div>
      </section>
    </PageShell>
  );
}
