import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/request-security";
import { dailyMinuteOptions, learningFormats, onboardingExperienceLevels, onboardingGoals, onboardingLanguages, validateDisplayName, validateProfileUsername } from "@/lib/profile-validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !user) return NextResponse.json({ message: "Sign in again to finish setup." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "Onboarding details are required." }, { status: 400 });
  const display = validateDisplayName(typeof body.displayName === "string" ? body.displayName : "");
  const username = validateProfileUsername(typeof body.username === "string" ? body.username : "");
  if (!display.valid) return NextResponse.json({ message: display.message }, { status: 400 });
  if (!username.valid) return NextResponse.json({ message: username.message }, { status: 400 });
  if (!onboardingExperienceLevels.includes(body.experience as any) || !onboardingGoals.includes(body.primaryGoal as any) || !onboardingLanguages.includes(body.language as any) || !dailyMinuteOptions.includes(body.dailyMinutes as any) || !learningFormats.includes(body.learningFormat as any)) return NextResponse.json({ message: "Choose a valid option on every onboarding step." }, { status: 400 });
  const interests = Array.isArray(body.interests) ? body.interests.filter((item): item is string => typeof item === "string" && onboardingGoals.includes(item as any) && item !== body.primaryGoal).slice(0, 8) : [];
  const { error } = await (supabase as any).rpc("complete_profile_onboarding", { profile_display_name: display.normalized, profile_username: username.display, profile_experience: body.experience, primary_goal: body.primaryGoal, interests, starting_language: body.language, minutes_per_day: body.dailyMinutes, preferred_format: body.learningFormat });
  if (error) {
    const duplicate = error.code === "23505" || /duplicate|unique/i.test(error.message);
    return NextResponse.json({ message: duplicate ? "That username is already taken." : "Your learning profile could not be saved." }, { status: duplicate ? 409 : 400 });
  }
  return NextResponse.json({ message: "Your learning profile is ready." }, { headers: { "Cache-Control": "no-store" } });
}
