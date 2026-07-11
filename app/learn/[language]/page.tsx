import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { findPath, learningPaths } from "@/lib/curriculum";

export function generateStaticParams() {
  return learningPaths.map((path) => ({ language: path.slug }));
}

export default async function LanguagePathPage({ params }: { params: Promise<{ language: string }> }) {
  const { language } = await params;
  const path = findPath(language);
  if (!path) notFound();

  return (
    <PageShell>
      <div className="glass rounded-[2rem] p-7">
        <div className={`mb-6 h-2 rounded-full bg-gradient-to-r ${path.color}`} />
        <p className="text-xs font-black uppercase text-amber-700">Learning path</p>
        <h1 className="mt-2 text-5xl font-black text-lab-navy">{path.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{path.description}</p>
      </div>
      <div className="mt-5 grid gap-5">
        {path.modules.map((module) => (
          <section key={module.title} className="glass rounded-[2rem] p-6">
            <p className="text-xs font-black uppercase text-lab-blue">{module.level}</p>
            <h2 className="mt-2 text-3xl font-black text-lab-navy">{module.title}</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {module.lessons.map((lesson) => (
                <Link key={lesson.slug} href={`/learn/${path.slug}/${lesson.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-xl font-black text-lab-navy">{lesson.title}</h3>
                  <p className="mt-2 text-slate-600">{lesson.objective}</p>
                  <p className="mt-4 text-sm font-black text-lab-blue">{lesson.estimatedMinutes} min lesson</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
