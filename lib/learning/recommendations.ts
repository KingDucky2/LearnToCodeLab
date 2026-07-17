import { availableLessons, findLessonById, playableCourse } from "@/lib/learning/catalog";
import type { LearningSummary } from "@/lib/learning/types";

export function recommendNextLesson(summary: LearningSummary, preferences?: { preferredLanguage?: string | null; learningGoal?: string | null }) {
  const incomplete = availableLessons.find((lesson) => !summary.completedLessonIds.includes(lesson.id));
  const lesson = incomplete ?? availableLessons[availableLessons.length - 1];
  const location = lesson ? findLessonById(lesson.id) : null;
  const preferenceReason = preferences?.preferredLanguage === "html" || preferences?.learningGoal === "Build websites"
    ? "It matches the web-development goal in your learner profile."
    : "It is the next guided step in Web Development Foundations.";
  return location ? { location, reason: preferenceReason, course: playableCourse } : null;
}
