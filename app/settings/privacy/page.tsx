import { PageShell, SectionHeader } from "@/components/PageShell";

export default function PrivacyPage() {
  return (
    <PageShell>
      <SectionHeader eyebrow="Privacy" title="Control your learning data." copy="Users should receive personalization even when broader model-improvement data sharing is disabled." />
      <div className="glass rounded-[2rem] p-6">
        <div className="grid gap-4">
          {[
            ["AI personalization", "Use your private progress to recommend lessons and practice.", "On by default"],
            ["Help improve LearnToCode Lab", "Allow anonymized learning interactions, mistakes, feedback ratings, and code examples to be reviewed and used to improve educational systems.", "Off by default"],
            ["Data export", "Request a copy of profile, progress, attempts, projects, and privacy settings.", "Available"],
            ["Delete account", "Request deletion of account data and learning history.", "Available"]
          ].map(([title, copy, state]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-lab-navy">{title}</h2>
                  <p className="mt-2 max-w-3xl text-slate-600">{copy}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black uppercase text-slate-600">{state}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
