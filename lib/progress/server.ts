import "server-only";
import { cache } from "react";
import { availableLessons } from "@/lib/learning/catalog";
import type { LearningSummary } from "@/lib/learning/types";
import { getCurrentUserRole } from "@/lib/maintenance-server";

const emptySummary: LearningSummary = { progress: [], currentLessonId: null, completedLessonIds: [] };

export const getLearningSummary = cache(async function getLearningSummary(): Promise<LearningSummary> {
  const { supabase, user } = await getCurrentUserRole();
  if (!supabase || !user) return emptySummary;
  const db = supabase as any;
  const { data, error } = await db.from("lesson_progress")
    .select("lesson_id,status,completion_percent,completed_at,last_opened_at")
    .eq("user_id", user.id)
    .order("last_opened_at", { ascending: false });
  if (error) {
    if (!["42P01", "42703", "PGRST205"].includes(error.code)) console.error("Unable to load learning progress.", { code: error.code ?? "unknown" });
    return emptySummary;
  }
  const progress: LearningSummary["progress"] = (data ?? []).map((row: any) => ({
    lessonId: row.lesson_id as string,
    status: row.status as "not_started" | "in_progress" | "completed",
    completionPercent: Number(row.completion_percent ?? 0),
    completedAt: row.completed_at as string | null,
    lastOpenedAt: row.last_opened_at as string
  }));
  return {
    progress,
    currentLessonId: progress[0]?.lessonId ?? null,
    completedLessonIds: progress.filter((item) => item.status === "completed").map((item) => item.lessonId)
  };
});

export const getLessonWorkspaceState = cache(async function getLessonWorkspaceState(lessonId: string) {
  const { supabase, user } = await getCurrentUserRole();
  if (!supabase || !user) return { signedIn: false, files: {} as Record<string, string>, completed: false };
  const db = supabase as any;
  const [codeResult, progressResult] = await Promise.all([
    db.from("lesson_code").select("file_name,content").eq("user_id", user.id).eq("lesson_id", lessonId),
    db.from("lesson_progress").select("status").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle()
  ]);
  const ignorable = (error: any) => !error || ["42P01", "42703", "PGRST205"].includes(error.code);
  if (!ignorable(codeResult.error) || !ignorable(progressResult.error)) console.error("Unable to restore the lesson workspace.", { code: codeResult.error?.code ?? progressResult.error?.code ?? "unknown" });
  return {
    signedIn: true,
    files: Object.fromEntries((codeResult.data ?? []).map((row: any) => [row.file_name, row.content])) as Record<string, string>,
    completed: progressResult.data?.status === "completed"
  };
});

export function calculateCourseProgress(summary: LearningSummary) {
  if (!availableLessons.length) return 0;
  return Math.round((summary.completedLessonIds.length / availableLessons.length) * 100);
}
