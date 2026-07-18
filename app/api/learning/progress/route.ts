import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation } from "@/lib/request-security";
import { validateLearningProgressInput } from "@/lib/progress/input";

export async function PUT(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !user) return NextResponse.json({ message: "Sign in to save lesson progress." }, { status: 401 });
  const input = validateLearningProgressInput(await request.json().catch(() => null));
  if (!input.ok) return NextResponse.json({ message: input.message }, { status: 400 });
  const db = supabase as any;
  const { error } = await db.rpc("save_lesson_workspace", {
    course_slug: input.value.courseSlug,
    module_slug: input.value.moduleSlug,
    lesson_slug: input.value.lessonSlug,
    code_files: input.value.files,
    mark_completed: input.value.completed
  });
  if (error) {
    const setupMissing = ["42P01", "42883", "PGRST202"].includes(error.code);
    console.error("Lesson workspace save failed.", { code: error.code ?? "unknown" });
    return NextResponse.json({ message: setupMissing ? "Learning progress storage is not configured yet. Apply the latest Supabase migration." : error.code === "42501" ? "Your session expired. Sign in again to keep saving." : "Your work could not be saved. Your editor content is still available in this tab." }, { status: setupMissing ? 503 : error.code === "42501" ? 401 : 500 });
  }
  return NextResponse.json({ message: input.value.completed ? "Lesson completed." : "Progress saved." }, { headers: { "Cache-Control": "no-store" } });
}
