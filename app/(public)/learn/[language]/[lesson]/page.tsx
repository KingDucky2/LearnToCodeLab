import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { findPath, learningPaths } from "@/lib/curriculum";

export function generateStaticParams() {
  return learningPaths.flatMap((path) => path.modules.flatMap((module) => module.lessons.map((lesson) => ({ language: path.slug, lesson: lesson.slug }))));
}

export default async function LessonPage({ params }: { params: Promise<{ language: string; lesson: string }> }) {
  const { language, lesson: lessonSlug } = await params;
  const path = findPath(language);
  const lesson = path?.modules.flatMap((module) => module.lessons).find((item) => item.slug === lessonSlug);
  if (!path || !lesson) notFound();

  return (
    <PageShell>
      <article className="glass content-wrap min-w-0 rounded-lg p-7">
        <p className="text-xs font-black uppercase text-amber-700">{path.title} lesson</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-foreground sm:text-4xl">{lesson.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{lesson.objective}</p>
        <div className="mt-7 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)]">
          <aside className="rounded-lg bg-surface-secondary p-5">
            <h2 className="text-xl font-black text-foreground">Lesson structure</h2>
            <ul className="mt-4 grid gap-2 text-sm font-bold text-secondary">
              {lesson.sections.map((section) => <li key={section}>{section}</li>)}
            </ul>
          </aside>
          <div className="min-w-0 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-2xl font-black text-foreground">Interactive lesson placeholder</h2>
            <p className="mt-3 text-muted">This foundation reserves the full lesson pattern: objective, why it matters, explanation, visual/example, guided practice, independent practice, common mistake, debugging exercise, knowledge check, mini-project, and recommendation.</p>
            <div className="mt-5 rounded-lg bg-[#07101d] p-4 text-teal-50">
              <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words text-sm">{`// Try it
changeThisValue = true;
// Run, observe, then explain what changed.`}</pre>
            </div>
            <p className="mt-5 rounded-lg bg-blue-50 p-4 text-sm font-black text-blue-900">Checkpoint: {lesson.checkpoint}</p>
          </div>
        </div>
        <Link href={`/learn/${path.slug}`} className="mt-6 inline-flex btn-primary">Back to {path.title}</Link>
      </article>
    </PageShell>
  );
}
