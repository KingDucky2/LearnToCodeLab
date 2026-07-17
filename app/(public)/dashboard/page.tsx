import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3 } from "lucide-react";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { AccountAvatar } from "@/components/AccountAvatar";
import { RoleBadge } from "@/components/RoleBadge";
import { availableLessons, findLessonById, getLessonHref, playableCourse } from "@/lib/learning/catalog";
import { recommendNextLesson } from "@/lib/learning/recommendations";
import { resolveAccountIdentity } from "@/lib/identity";
import { getCurrentUserRole } from "@/lib/maintenance-server";
import { calculateCourseProgress, getLearningSummary } from "@/lib/progress/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [session, summary] = await Promise.all([getCurrentUserRole(), getLearningSummary()]);
  if (!session.user) redirect("/login?next=/dashboard");
  const identity = resolveAccountIdentity(session.user, session.profile);
  const current = summary.currentLessonId ? findLessonById(summary.currentLessonId) : null;
  const recommendation = recommendNextLesson(summary, { preferredLanguage: session.profile?.preferred_language, learningGoal: session.profile?.learning_goal });
  const continueLocation = current ?? recommendation?.location ?? null;
  const completed = summary.progress.filter((item) => item.status === "completed").slice(0, 4);
  const progress = calculateCourseProgress(summary);

  return (
    <PageShell>
      <SectionHeader eyebrow="Dashboard" title="Continue your path." copy="Resume your latest lesson, review completed work, and take the next guided step." />
      {!session.profile?.username || !session.profile?.display_name ? <div className="mb-5 flex flex-col justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-950 sm:flex-row sm:items-center"><div><p className="font-black">Complete your learner profile</p><p className="text-sm">Add the identity details that help personalize your account. You can keep using the platform while you finish.</p></div><Link className="btn-outline shrink-0" href="/profile">Review profile</Link></div> : null}
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"><AccountAvatar identity={identity} decorative /><p className="min-w-0"><span className="flex flex-wrap items-center gap-2 font-black text-foreground">{identity.label}<RoleBadge role={session.role} /></span><span className="block truncate text-sm text-subtle">{identity.email}</span></p></div>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="surface-panel">
          <p className="text-sm font-extrabold text-warning">Continue Learning</p>
          {continueLocation ? <><h2 className="mt-2 text-2xl font-black leading-tight text-foreground sm:text-3xl">{continueLocation.lesson.title}</h2><p className="mt-2 font-bold text-secondary">{playableCourse.title} · {continueLocation.module.title}</p><p className="mt-4 max-w-2xl text-muted">{continueLocation.lesson.description}</p><Link href={getLessonHref(continueLocation.course.slug, continueLocation.module.slug, continueLocation.lesson.slug)} className="btn-primary mt-6">{summary.currentLessonId ? "Resume lesson" : "Start first lesson"}</Link></> : <><h2 className="mt-2 text-2xl font-black text-foreground">Your next course is being prepared.</h2><Link href="/learn" className="btn-primary mt-6">Browse courses</Link></>}
        </div>
        <div className="surface-card"><p className="text-sm font-extrabold text-warning">Course progress</p><div className="mt-4 flex items-end justify-between gap-3"><strong className="text-4xl font-black text-foreground">{progress}%</strong><span className="text-sm font-bold text-muted">{summary.completedLessonIds.length} of {availableLessons.length} lessons</span></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-secondary" aria-label={`${progress}% of course completed`}><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div><Link href={`/learn/${playableCourse.slug}`} className="btn-outline mt-5 w-full">View course</Link></div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="surface-card"><p className="text-xs font-black uppercase tracking-wide text-primary">Recommended next lesson</p>{recommendation ? <><h2 className="mt-2 text-xl font-black text-foreground">{recommendation.location.lesson.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{recommendation.reason}</p><Link className="btn-ghost mt-4 px-0 text-primary" href={getLessonHref(recommendation.location.course.slug, recommendation.location.module.slug, recommendation.location.lesson.slug)}>Open recommendation</Link></> : <p className="mt-3 text-muted">You completed every currently available lesson. More are coming soon.</p>}</div>
        <div className="surface-card"><p className="text-xs font-black uppercase tracking-wide text-primary">Recently completed</p>{completed.length ? <ul className="mt-3 grid gap-2">{completed.map((item) => { const location = findLessonById(item.lessonId); return location ? <li key={item.lessonId}><Link href={getLessonHref(location.course.slug, location.module.slug, location.lesson.slug)} className="flex items-center gap-3 rounded-lg bg-surface-secondary p-3 text-sm font-bold text-secondary"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" /><span className="min-w-0 flex-1">{location.lesson.title}</span><span className="hidden shrink-0 items-center gap-1 text-xs text-muted sm:flex"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{location.lesson.estimatedMinutes} min</span></Link></li> : null; })}</ul> : <div className="mt-4 rounded-lg bg-surface-secondary p-4"><p className="font-bold text-foreground">No completed lessons yet</p><p className="mt-1 text-sm text-muted">Finished lessons will appear here automatically.</p></div>}</div>
      </section>
    </PageShell>
  );
}
