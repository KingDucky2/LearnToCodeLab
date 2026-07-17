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
      <div className="glass rounded-lg p-7">
        <div className={`mb-6 h-2 rounded-full bg-gradient-to-r ${path.color}`} />
        <p className="text-xs font-black uppercase text-amber-700">Learning path</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-foreground sm:text-4xl">{path.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{path.description}</p>
      </div>
      <div className="mt-5 grid gap-5">
        {path.modules.map((module) => (
          <section key={module.title} className="glass content-wrap min-w-0 rounded-lg p-6">
            <p className="text-xs font-black uppercase text-primary">{module.level}</p>
            <h2 className="mt-2 text-3xl font-black text-foreground">{module.title}</h2>
            <div className="mt-5 grid min-w-0 gap-3 min-[900px]:grid-cols-2">
              {module.lessons.map((lesson) => (
                <Link key={lesson.slug} href={`/learn/${path.slug}/${lesson.slug}`} className="content-wrap block min-w-0 rounded-lg border border-border bg-surface p-5">
                  <h3 className="text-xl font-black leading-snug text-foreground">{lesson.title}</h3>
                  <p className="mt-2 text-muted">{lesson.objective}</p>
                  <p className="mt-4 text-sm font-black text-primary">{lesson.estimatedMinutes} min lesson</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
