import Link from "next/link";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { learningPaths } from "@/lib/curriculum";

export default function LearnPage() {
  return (
    <PageShell>
      <SectionHeader eyebrow="Lesson library" title="Choose a learning path." copy="Each path is structured as levels, modules, lessons, checkpoints, and projects instead of disconnected lesson cards." />
      <div className="grid gap-4 md:grid-cols-2">
        {learningPaths.map((path) => (
          <Link key={path.slug} href={`/learn/${path.slug}`} className="glass rounded-[2rem] p-6">
            <div className={`mb-6 h-2 rounded-full bg-gradient-to-r ${path.color}`} />
            <h2 className="text-3xl font-black text-lab-navy">{path.title}</h2>
            <p className="mt-3 text-slate-600">{path.description}</p>
            <p className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm font-black text-slate-700">Build goal: {path.buildGoal}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
