import Link from "next/link";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { learningPaths } from "@/lib/curriculum";

export default function LearnPage() {
  return (
    <PageShell>
      <SectionHeader eyebrow="Lesson library" title="Choose a learning path." copy="Each path is structured as levels, modules, lessons, checkpoints, and projects instead of disconnected lesson cards." />
      <div className="grid min-w-0 gap-4 min-[900px]:grid-cols-2">
        {learningPaths.map((path) => (
          <Link key={path.slug} href={`/learn/${path.slug}`} className="glass content-wrap block min-w-0 rounded-lg p-6">
            <div className={`mb-6 h-2 rounded-full bg-gradient-to-r ${path.color}`} />
            <h2 className="text-3xl font-black leading-tight text-foreground">{path.title}</h2>
            <p className="mt-3 text-muted">{path.description}</p>
            <p className="mt-5 rounded-lg bg-surface-secondary p-4 text-sm font-black text-secondary">Build goal: {path.buildGoal}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
