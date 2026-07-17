import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/request-security";
import { dailyMinuteOptions, learningFormats, normalizeDisplayName, onboardingExperienceLevels, onboardingGoals, onboardingLanguages, validateDisplayName, validateProfileUsername } from "@/lib/profile-validation";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !user) return NextResponse.json({ message: "Sign in again to update your profile." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "Profile details are required." }, { status: 400 });
  const display = validateDisplayName(typeof body.displayName === "string" ? body.displayName : "");
  const username = validateProfileUsername(typeof body.username === "string" ? body.username : "", true);
  if (!display.valid) return NextResponse.json({ message: display.message }, { status: 400 });
  if (!username.valid) return NextResponse.json({ message: username.message }, { status: 400 });
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 280) : "";
  const experience = onboardingExperienceLevels.includes(body.experienceLevel as any) ? body.experienceLevel as string : null;
  const goal = onboardingGoals.includes(body.learningGoal as any) ? body.learningGoal as string : null;
  const rawLanguage = typeof body.preferredLanguage === "string" ? body.preferredLanguage.toLowerCase().replace("c++", "cpp").replaceAll(" ", "_") : "";
  const language = onboardingLanguages.includes(rawLanguage as any) ? rawLanguage : null;
  const dailyMinutes = dailyMinuteOptions.includes(body.dailyMinutes as any) ? body.dailyMinutes as number : 20;
  const learningFormat = learningFormats.includes(body.learningFormat as any) ? body.learningFormat as string : "mixed";
  if (!experience || !goal || !language) return NextResponse.json({ message: "Choose valid learning profile options." }, { status: 400 });

  const db = supabase as any;
  const profileResult = await db.from("profiles").update({ display_name: normalizeDisplayName(display.normalized), username: username.display || null, bio: bio || null, preferred_language: language, experience_level: experience, learning_goal: goal }).eq("id", user.id);
  if (profileResult.error) {
    const duplicate = profileResult.error.code === "23505" || /duplicate|unique/i.test(profileResult.error.message);
    return NextResponse.json({ message: duplicate ? "That username is already taken." : "Your profile could not be updated." }, { status: duplicate ? 409 : 400 });
  }
  const preferenceResult = await db.from("learning_preferences").upsert({ user_id: user.id, daily_minutes: dailyMinutes, learning_format: learningFormat }, { onConflict: "user_id" });
  if (preferenceResult.error) return NextResponse.json({ message: "Your learning preferences could not be updated." }, { status: 400 });
  return NextResponse.json({ message: "Profile updated.", username: username.display }, { headers: { "Cache-Control": "no-store" } });
}
