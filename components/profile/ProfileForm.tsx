"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import type { AccountIdentity } from "@/lib/identity";
import { dailyMinuteOptions, learningFormats, onboardingExperienceLevels, onboardingGoals, onboardingLanguages, validateDisplayName, validateProfileUsername } from "@/lib/profile-validation";

type ProfileFormProps = {
  identity: AccountIdentity;
  role: string;
  profile: { display_name: string | null; username: string | null; avatar_url: string | null; avatar_source: string; bio: string | null; preferred_language: string | null; experience_level: string | null; learning_goal: string | null };
  preferences: { daily_minutes: number; learning_format: string } | null;
};

const languageLabels: Record<string, string> = { html: "HTML", css: "CSS", javascript: "JavaScript", python: "Python", cpp: "C++", swift: "Swift", lua: "Lua", help_me_choose: "Help me choose" };
const formatLabels: Record<string, string> = { guided_lessons: "Guided lessons", projects: "Projects", quizzes: "Quizzes", mixed: "Mixed learning" };

export function ProfileForm({ identity, profile, preferences }: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? identity.label);
  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const initialLanguage = profile.preferred_language?.toLowerCase().replace("c++", "cpp").replaceAll(" ", "_") ?? "javascript";
  const [preferredLanguage, setPreferredLanguage] = useState(onboardingLanguages.includes(initialLanguage as any) ? initialLanguage : "javascript");
  const [experienceLevel, setExperienceLevel] = useState(onboardingExperienceLevels.includes(profile.experience_level as any) ? profile.experience_level! : "Completely new");
  const [learningGoal, setLearningGoal] = useState(onboardingGoals.includes(profile.learning_goal as any) ? profile.learning_goal! : "Learn programming basics");
  const [dailyMinutes, setDailyMinutes] = useState(preferences?.daily_minutes ?? 20);
  const [learningFormat, setLearningFormat] = useState(preferences?.learning_format ?? "mixed");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const displayValidation = useMemo(() => validateDisplayName(displayName), [displayName]);
  const usernameValidation = useMemo(() => validateProfileUsername(username, true), [username]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(null);
    if (!displayValidation.valid) return setMessage({ type: "error", text: displayValidation.message });
    if (!usernameValidation.valid) return setMessage({ type: "error", text: usernameValidation.message });
    setLoading(true);
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName, username, bio, preferredLanguage, experienceLevel, learningGoal, dailyMinutes, learningFormat }) });
      const body = await response.json() as { message?: string; username?: string };
      setMessage({ type: response.ok ? "success" : "error", text: body.message ?? "Your profile could not be updated." });
      if (response.ok) { setUsername(body.username ?? username.trim()); router.refresh(); }
    } catch { setMessage({ type: "error", text: "Your profile could not be updated. Check your connection and try again." }); }
    finally { setLoading(false); }
  }

  return <div className="grid gap-5"><AvatarPicker identity={identity} hasCustomAvatar={profile.avatar_source === "custom"} /><form onSubmit={handleSubmit} className="grid gap-5 surface-panel">
    <div className="grid gap-4 md:grid-cols-2"><label htmlFor="display-name" className="form-label">Display name<input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="form-control" maxLength={40} autoComplete="name" aria-invalid={!displayValidation.valid} /><span className={`text-xs ${displayValidation.valid ? "text-success" : "text-danger"}`}>{displayValidation.valid ? "2–40 characters; capitalization and ordinary punctuation are preserved." : displayValidation.message}</span></label><label htmlFor="username" className="form-label">Username<input id="username" value={username} onChange={(event) => setUsername(event.target.value)} className="form-control" maxLength={20} autoComplete="username" placeholder="Luke_G" aria-invalid={!usernameValidation.valid} /><span className={`text-xs ${usernameValidation.valid ? "text-success" : "text-danger"}`}>{usernameValidation.valid ? "3–20 letters, numbers, or underscores. Capitalization is preserved." : usernameValidation.message}</span></label></div>
    <label htmlFor="bio" className="form-label">Bio<textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} className="min-h-28 form-control" maxLength={280} placeholder="What are you learning right now?" /></label>
    <div className="grid gap-4 md:grid-cols-2"><label className="form-label">Experience level<select className="form-control" value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)}>{onboardingExperienceLevels.map((value) => <option key={value}>{value}</option>)}</select></label><label className="form-label">What would you like to learn first?<select className="form-control" value={learningGoal} onChange={(event) => setLearningGoal(event.target.value)}>{onboardingGoals.map((value) => <option key={value}>{value}</option>)}</select></label><label className="form-label">Starting language<select className="form-control" value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)}>{onboardingLanguages.map((value) => <option key={value} value={value}>{languageLabels[value]}</option>)}</select></label><label className="form-label">Minutes per day<select className="form-control" value={dailyMinutes} onChange={(event) => setDailyMinutes(Number(event.target.value))}>{dailyMinuteOptions.map((value) => <option key={value} value={value}>{value} minutes</option>)}</select></label><label className="form-label md:col-span-2">Learning style<select className="form-control" value={learningFormat} onChange={(event) => setLearningFormat(event.target.value)}>{learningFormats.map((value) => <option key={value} value={value}>{formatLabels[value]}</option>)}</select></label></div>
    <button disabled={loading || !displayValidation.valid || !usernameValidation.valid} className="btn-primary">{loading ? "Saving…" : "Save profile"}</button>{message ? <AuthMessage type={message.type}>{message.text}</AuthMessage> : null}
  </form></div>;
}
