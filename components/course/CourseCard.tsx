import Link from "next/link";
import { BookOpen, Clock3, Code2, LockKeyhole } from "lucide-react";
import type { CourseDefinition } from "@/lib/learning/types";

export function CourseCard({ course, progress = 0 }: { course: CourseDefinition; progress?: number }) {
  const available = course.status === "available";
  const lessonCount = course.modules.reduce((total, module) => total + module.lessons.length, 0);
  const action = progress > 0 ? "Continue" : "Start course";
  return (
    <article className="glass content-wrap flex min-w-0 flex-col rounded-lg p-6">
      <div className={`mb-5 h-2 rounded-full bg-gradient-to-r ${course.color}`} />
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary text-primary">
          {course.icon === "Code2" ? <Code2 className="h-6 w-6" aria-hidden="true" /> : <BookOpen className="h-6 w-6" aria-hidden="true" />}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${available ? progress > 0 ? "bg-blue-100 text-blue-900" : "bg-emerald-100 text-emerald-900" : "bg-surface-secondary text-muted"}`}>
          {available ? progress > 0 ? "In Progress" : "Available" : "Coming Soon"}
        </span>
      </div>
      <h2 className="mt-5 text-2xl font-black leading-tight text-foreground">{course.title}</h2>
      <p className="mt-3 flex-1 leading-7 text-muted">{course.description}</p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-secondary">
        <span>{course.difficulty}</span>
        {available ? <><span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" aria-hidden="true" />{course.estimatedHours} hours</span><span>{lessonCount} lessons available</span></> : null}
      </div>
      {available ? <div className="mt-5" aria-label={`${progress}% complete`}><div className="mb-2 flex justify-between text-xs font-bold text-muted"><span>Course progress</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div></div> : null}
      {available ? <Link href={`/learn/${course.slug}`} className="btn-primary mt-6 w-full">{action}</Link> : <button type="button" disabled className="btn-outline mt-6 w-full cursor-not-allowed opacity-65"><LockKeyhole className="h-4 w-4" aria-hidden="true" />Coming Soon</button>}
    </article>
  );
}
