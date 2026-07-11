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
      <article className="glass rounded-[2rem] p-7">
        <p className="text-xs font-black uppercase text-amber-700">{path.title} lesson</p>
        <h1 className="mt-2 text-5xl font-black text-lab-navy">{lesson.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{lesson.objective}</p>
        <div className="mt-7 grid gap-4 lg:grid-cols-[.75fr_1.25fr]">
          <aside className="rounded-2xl bg-slate-100 p-5">
            <h2 className="text-xl font-black text-lab-navy">Lesson structure</h2>
            <ul className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
              {lesson.sections.map((section) => <li key={section}>{section}</li>)}
            </ul>
          </aside>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-2xl font-black text-lab-navy">Interactive lesson placeholder</h2>
            <p className="mt-3 text-slate-600">This foundation reserves the full lesson pattern: objective, why it matters, explanation, visual/example, guided practice, independent practice, common mistake, debugging exercise, knowledge check, mini-project, and recommendation.</p>
            <div className="mt-5 rounded-2xl bg-[#07101d] p-4 text-teal-50">
              <pre className="whitespace-pre-wrap text-sm">{`// Try it
changeThisValue = true;
// Run, observe, then explain what changed.`}</pre>
            </div>
            <p className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-black text-blue-900">Checkpoint: {lesson.checkpoint}</p>
          </div>
        </div>
        <Link href={`/learn/${path.slug}`} className="mt-6 inline-flex rounded-xl bg-lab-navy px-4 py-3 font-black text-white">Back to {path.title}</Link>
      </article>
    </PageShell>
  );
}
