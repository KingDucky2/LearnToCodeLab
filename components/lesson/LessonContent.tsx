import { CheckCircle2, Clock3, Lightbulb, Target } from "lucide-react";
import type { LessonDefinition } from "@/lib/learning/types";

export function LessonContent({ lesson }: { lesson: LessonDefinition }) {
  return (
    <article className="content-wrap min-w-0 rounded-lg border border-border bg-surface p-5 sm:p-7">
      <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide text-primary"><span>{lesson.difficulty}</span><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{lesson.estimatedMinutes} minutes</span><span aria-hidden="true">·</span><span>{lesson.xpReward} XP</span></div>
      <h1 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl">{lesson.title}</h1>
      <p className="mt-2 text-lg font-bold text-secondary">{lesson.subtitle}</p>
      <p className="mt-4 leading-7 text-muted">{lesson.description}</p>

      <section className="mt-7 rounded-lg bg-surface-secondary p-5" aria-labelledby="objectives-heading"><h2 id="objectives-heading" className="flex items-center gap-2 text-lg font-black text-foreground"><Target className="h-5 w-5 text-primary" aria-hidden="true" />Objectives</h2><ul className="mt-3 grid gap-2">{lesson.objectives.map((objective) => <li key={objective} className="flex gap-2 text-sm leading-6 text-secondary"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />{objective}</li>)}</ul></section>

      <section className="mt-8" aria-labelledby="lesson-heading"><h2 id="lesson-heading" className="text-2xl font-black text-foreground">Learn the concept</h2><div className="mt-4 grid gap-4 leading-7 text-secondary">{lesson.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>

      {lesson.examples.map((example) => <section key={example.title} className="mt-8" aria-labelledby={`example-${example.title.replaceAll(" ", "-")}`}><h2 id={`example-${example.title.replaceAll(" ", "-")}`} className="text-xl font-black text-foreground">{example.title}</h2><p className="mt-2 text-muted">{example.explanation}</p><pre className="mt-4 max-w-full overflow-x-auto rounded-lg bg-[#07101d] p-4 text-sm leading-6 text-teal-50"><code>{example.code}</code></pre></section>)}

      <section className="mt-8" aria-labelledby="tasks-heading"><h2 id="tasks-heading" className="text-2xl font-black text-foreground">Your tasks</h2><ol className="mt-4 grid gap-3">{lesson.tasks.map((task, index) => <li key={task} className="flex gap-3 rounded-lg border border-border bg-surface-secondary p-4 text-sm font-bold leading-6 text-secondary"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{index + 1}</span>{task}</li>)}</ol></section>

      <details className="mt-7 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950"><summary className="flex cursor-pointer list-none items-center gap-2 font-black"><Lightbulb className="h-5 w-5" aria-hidden="true" />Need a hint?</summary><ul className="mt-3 grid gap-2 pl-7 text-sm leading-6">{lesson.hints.map((hint) => <li key={hint}>{hint}</li>)}</ul></details>
    </article>
  );
}
