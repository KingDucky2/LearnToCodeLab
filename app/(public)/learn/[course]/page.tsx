import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, LockKeyhole } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { findCourse, getLessonHref } from "@/lib/learning/catalog";
import { calculateCourseProgress, getLearningSummary } from "@/lib/progress/server";

const legacyCourses: Record<string, string> = { html: "web-development-foundations" };

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseSlug } = await params;
  if (legacyCourses[courseSlug]) redirect(`/learn/${legacyCourses[courseSlug]}`);
  const course = findCourse(courseSlug);
  if (!course) notFound();
  const summary = await getLearningSummary();
  const progress = course.status === "available" ? calculateCourseProgress(summary) : 0;
  const firstIncomplete = course.modules.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson }))).find(({ lesson }) => !summary.completedLessonIds.includes(lesson.id));

  return (
    <PageShell>
      <div className="glass content-wrap min-w-0 rounded-lg p-6 sm:p-8"><div className={`mb-6 h-2 rounded-full bg-gradient-to-r ${course.color}`} /><div className="flex flex-wrap items-center gap-3 text-sm font-black text-primary"><span>{course.difficulty}</span>{course.status === "available" ? <><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" aria-hidden="true" />About {course.estimatedHours} hours</span></> : null}</div><h1 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-5xl">{course.title}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{course.description}</p>{course.status === "available" ? <><div className="mt-6 max-w-xl" aria-label={`${progress}% complete`}><div className="mb-2 flex justify-between text-sm font-bold text-secondary"><span>Course progress</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></div>{firstIncomplete ? <Link href={getLessonHref(course.slug, firstIncomplete.module.slug, firstIncomplete.lesson.slug)} className="btn-primary mt-6">{progress ? "Continue course" : "Start course"}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : null}</> : <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-surface-secondary px-4 py-2 text-sm font-black text-muted"><LockKeyhole className="h-4 w-4" aria-hidden="true" />Coming Soon</p>}</div>

      <section className="mt-6" aria-labelledby="modules-heading"><h2 id="modules-heading" className="text-2xl font-black text-foreground">Course modules</h2><div className="mt-4 grid gap-4">
        {course.modules.length ? course.modules.map((module, moduleIndex) => <article key={module.id} className="surface-card content-wrap min-w-0"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="min-w-0"><p className="text-xs font-black uppercase tracking-wide text-primary">Module {moduleIndex + 1}</p><h3 className="mt-1 text-2xl font-black text-foreground">{module.title}</h3><p className="mt-2 text-muted">{module.description}</p></div>{module.status === "coming_soon" ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-secondary px-3 py-1 text-xs font-black text-muted"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />Coming Soon</span> : <Link href={`/learn/${course.slug}/${module.slug}`} className="btn-outline shrink-0">View module<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}</div>{module.lessons.length ? <ol className="mt-5 grid gap-2">{module.lessons.map((lesson) => <li key={lesson.id} className="flex items-center gap-2 rounded-lg bg-surface-secondary px-4 py-3 text-sm font-bold text-secondary">{summary.completedLessonIds.includes(lesson.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Completed" /> : <span className="h-4 w-4 shrink-0 rounded-full border-2 border-border" aria-hidden="true" />}<span className="min-w-0 flex-1">{lesson.title}</span><span className="shrink-0 text-xs text-muted">{lesson.estimatedMinutes} min</span></li>)}</ol> : null}</article>) : <div className="surface-card"><p className="font-black text-foreground">This course is being prepared.</p><p className="mt-2 text-muted">Its modules and lessons will appear here when they are ready.</p></div>}
      </div></section>
    </PageShell>
  );
}
