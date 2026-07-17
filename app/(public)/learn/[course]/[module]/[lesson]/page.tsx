import { notFound } from "next/navigation";
import { LearningWorkspace } from "@/components/learning/LearningWorkspace";
import { courses, findLesson } from "@/lib/learning/catalog";
import { getLearningSummary, getLessonWorkspaceState } from "@/lib/progress/server";

export function generateStaticParams() {
  return courses.flatMap((course) => course.modules.flatMap((module) => module.lessons.map((lesson) => ({ course: course.slug, module: module.slug, lesson: lesson.slug }))));
}

export default async function LessonPage({ params }: { params: Promise<{ course: string; module: string; lesson: string }> }) {
  const { course, module, lesson } = await params;
  const location = findLesson(course, module, lesson);
  if (!location) notFound();
  const [workspace, summary] = await Promise.all([getLessonWorkspaceState(location.lesson.id), getLearningSummary()]);
  return <LearningWorkspace location={location} restoredFiles={workspace.files} signedIn={workspace.signedIn} initiallyCompleted={workspace.completed} completedLessonIds={summary.completedLessonIds} />;
}
