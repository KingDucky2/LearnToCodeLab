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
  const struggle = typeof body.biggestStruggle === "string" ? body.biggestStruggle.trim().slice(0, 500) : "";
  const experience = onboardingExperienceLevels.includes(body.experienceLevel as any) ? body.experienceLevel as string : null;
  const goal = onboardingGoals.includes(body.learningGoal as any) ? body.learningGoal as string : null;
  const rawLanguage = typeof body.preferredLanguage === "string" ? body.preferredLanguage.toLowerCase().replace("c++", "cpp").replaceAll(" ", "_") : "";
  const language = onboardingLanguages.includes(rawLanguage as any) ? rawLanguage : null;
  const dailyMinutes = dailyMinuteOptions.includes(body.dailyMinutes as any) ? body.dailyMinutes as number : 20;
  const learningFormat = learningFormats.includes(body.learningFormat as any) ? body.learningFormat as string : "mixed";
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((item): item is string => typeof item === "string" && onboardingGoals.includes(item as any) && item !== goal).slice(0, 8)
    : [];
  if (!experience || !goal || !language) return NextResponse.json({ message: "Choose valid learning profile options." }, { status: 400 });

  const db = supabase as any;
  const { error } = await db.rpc("save_learner_profile", {
    profile_display_name: normalizeDisplayName(display.normalized),
    profile_username: username.display,
    profile_bio: bio,
    profile_experience: experience,
    primary_goal: goal,
    interests,
    starting_language: language,
    minutes_per_day: dailyMinutes,
    preferred_format: learningFormat,
    learning_struggle: struggle,
  });
  if (error) {
    const duplicate = error.code === "23505" || /duplicate|unique/i.test(error.message);
    const migrationMissing = ["42703", "42883", "PGRST202"].includes(error.code);
    console.error("Profile transaction failed.", { code: error.code ?? "unknown" });
    return NextResponse.json({
      message: duplicate ? "That username is already taken." : migrationMissing ? "Profile setup is incomplete. An administrator must apply the latest Supabase migration." : error.code === "42501" ? "Your session expired or you do not have permission to update this profile." : "The database could not save your profile. Your existing values were not changed.",
    }, { status: duplicate ? 409 : migrationMissing ? 503 : error.code === "42501" ? 403 : 400 });
  }
  return NextResponse.json({ message: "Profile updated.", username: username.display }, { headers: { "Cache-Control": "no-store" } });
}
