"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Clock3, LockKeyhole } from "lucide-react";
import { useEffect, useRef } from "react";
import { getLessonHref } from "@/lib/learning/catalog";
import type { CourseDefinition } from "@/lib/learning/types";

export function CourseNavigation({ course, activeLessonId, completedLessonIds }: { course: CourseDefinition; activeLessonId: string; completedLessonIds: string[] }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1536px)");
    const sync = () => { if (detailsRef.current) detailsRef.current.open = query.matches; };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return (
    <aside className="min-w-0 rounded-lg border border-border bg-surface p-4 2xl:sticky 2xl:top-[var(--app-header-clearance)] 2xl:max-h-[calc(100dvh-var(--app-header-clearance)-1rem)] 2xl:overflow-y-auto" aria-label="Course navigation"><details ref={detailsRef} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-black text-foreground 2xl:hidden"><span>Course navigation</span><span className="text-xs font-bold text-primary group-open:hidden">Show</span><span className="hidden text-xs font-bold text-primary group-open:inline">Hide</span></summary>
      <div className="mt-4 hidden group-open:block 2xl:mt-0 2xl:block">
      <Link href={`/learn/${course.slug}`} className="block rounded-md focus-visible:outline-none"><p className="text-xs font-black uppercase tracking-wide text-primary">Course</p><h2 className="mt-1 text-lg font-black leading-snug text-foreground">{course.title}</h2></Link>
      <div className="mt-5 grid gap-5">
        {course.modules.map((module) => (
          <section key={module.id} aria-labelledby={`module-${module.id}`}>
            <div className="flex items-center justify-between gap-2"><h3 id={`module-${module.id}`} className="text-sm font-black text-foreground">{module.title}</h3>{module.status === "coming_soon" ? <LockKeyhole className="h-4 w-4 text-muted" aria-label="Coming soon" /> : null}</div>
            {module.lessons.length ? <ol className="mt-2 grid gap-1">
              {module.lessons.map((lesson) => {
                const active = lesson.id === activeLessonId;
                const completed = completedLessonIds.includes(lesson.id);
                return <li key={lesson.id}><Link aria-current={active ? "step" : undefined} href={getLessonHref(course.slug, module.slug, lesson.slug)} className={`flex min-w-0 items-start gap-2 rounded-md px-2 py-2 text-sm font-bold ${active ? "bg-blue-50 text-blue-950 ring-1 ring-blue-200" : "text-secondary hover:bg-surface-secondary"}`}>{completed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Completed" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}<span className="min-w-0 leading-snug">{lesson.title}<span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-muted"><Clock3 className="h-3 w-3" aria-hidden="true" />{lesson.estimatedMinutes} min</span></span></Link></li>;
              })}
            </ol> : <p className="mt-2 text-xs text-muted">Lessons are coming soon.</p>}
          </section>
        ))}
      </div>
      </div>
    </details></aside>
  );
}
