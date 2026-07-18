import Link from "next/link";
import { ArrowRight, Clock3, LockKeyhole } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { findCourse, findModule, getLessonHref } from "@/lib/learning/catalog";
import { getLearningSummary } from "@/lib/progress/server";

const legacyLessons: Record<string, string> = {
  "html/html-structure": "/learn/web-development-foundations/introduction/what-is-html",
  "html/forms-accessibility": "/learn/web-development-foundations/html-basics/creating-your-first-web-page",
  "html/metadata-media": "/learn/web-development-foundations/html-basics/headings-paragraphs-and-text"
};

export default async function ModulePage({ params }: { params: Promise<{ course: string; module: string }> }) {
  const { course: courseSlug, module: moduleSlug } = await params;
  if (legacyLessons[`${courseSlug}/${moduleSlug}`]) redirect(legacyLessons[`${courseSlug}/${moduleSlug}`]);
  const course = findCourse(courseSlug);
  const courseModule = findModule(courseSlug, moduleSlug);
  if (!course || !courseModule) notFound();
  const summary = await getLearningSummary();
  return <PageShell><nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-2 text-sm font-bold text-muted"><Link href="/learn">Courses</Link><span aria-hidden="true">/</span><Link href={`/learn/${course.slug}`}>{course.title}</Link><span aria-hidden="true">/</span><span className="text-foreground">{courseModule.title}</span></nav><div className="glass rounded-lg p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-wide text-primary">Course module</p><h1 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">{courseModule.title}</h1><p className="mt-3 max-w-3xl text-lg leading-8 text-muted">{courseModule.description}</p></div>{courseModule.status === "coming_soon" ? <div className="surface-card mt-5"><p className="flex items-center gap-2 font-black text-foreground"><LockKeyhole className="h-5 w-5" aria-hidden="true" />Lessons are coming soon</p><p className="mt-2 text-muted">This module is visible in the roadmap, but it is not playable yet.</p></div> : <ol className="mt-5 grid gap-3">{courseModule.lessons.map((lesson, index) => <li key={lesson.id}><Link href={getLessonHref(course.slug, courseModule.slug, lesson.slug)} className="surface-card flex min-w-0 items-center gap-4 transition-colors hover:border-border-strong"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-black text-primary-foreground">{index + 1}</span><span className="min-w-0 flex-1"><span className="block text-lg font-black leading-snug text-foreground">{lesson.title}</span><span className="mt-1 block text-sm text-muted">{lesson.subtitle}</span></span><span className="hidden shrink-0 items-center gap-1 text-xs font-bold text-muted sm:flex"><Clock3 className="h-4 w-4" aria-hidden="true" />{lesson.estimatedMinutes} min</span><ArrowRight className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /></Link></li>)}</ol>}</PageShell>;
}
