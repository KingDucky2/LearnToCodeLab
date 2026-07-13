"use client";

import { FormEvent, useState } from "react";
import { getAuthErrorMessage, normalizeUsername, validateUsername } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase/browser";
import { AuthMessage } from "@/components/auth/AuthMessage";

type ProfileFormProps = {
  profile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    preferred_language: string | null;
    experience_level: string | null;
    learning_goal: string | null;
  };
};

const languages = ["HTML", "CSS", "JavaScript", "Python", "C++", "Swift", "Lua"];
const experienceLevels = ["New coder", "Some basics", "Building projects", "Advanced"];
const goals = ["Build websites", "Get job ready", "Make games", "Automate tasks", "Learn computer science"];

export function ProfileForm({ profile }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [preferredLanguage, setPreferredLanguage] = useState(profile.preferred_language ?? "JavaScript");
  const [experienceLevel, setExperienceLevel] = useState(profile.experience_level ?? "New coder");
  const [learningGoal, setLearningGoal] = useState(profile.learning_goal ?? "Build websites");
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!displayName.trim()) {
      setMessage({ type: "error", text: "Display name cannot be empty." });
      return;
    }

    const usernameResult = validateUsername(username);
    if (!usernameResult.valid) {
      setMessage({ type: "error", text: usernameResult.message ?? "Choose a different username." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage({ type: "error", text: "Sign in again to update your profile." });
        return;
      }

      const db = supabase as any;
      const { error } = await db
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          username: usernameResult.normalized || null,
          avatar_url: avatarUrl.trim() || null,
          bio: bio.trim() || null,
          preferred_language: preferredLanguage,
          experience_level: experienceLevel,
          learning_goal: learningGoal,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        const duplicate = error.message.toLowerCase().includes("duplicate") || error.message.toLowerCase().includes("unique");
        setMessage({ type: "error", text: duplicate ? "That username is already taken." : getAuthErrorMessage(error.message) });
        return;
      }

      setUsername(normalizeUsername(username));
      setMessage({ type: "success", text: "Profile updated." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lab">
      <div className="grid gap-4 md:grid-cols-2">
        <label htmlFor="display-name" className="grid gap-2 text-sm font-extrabold text-slate-700">
          Display name
          <input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" autoComplete="name" />
        </label>
        <label htmlFor="username" className="grid gap-2 text-sm font-extrabold text-slate-700">
          Username
          <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" autoComplete="username" placeholder="lowercase_name" />
        </label>
      </div>
      <label htmlFor="avatar-url" className="grid gap-2 text-sm font-extrabold text-slate-700">
        Avatar URL
        <input id="avatar-url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" type="url" placeholder="https://..." />
      </label>
      <label htmlFor="bio" className="grid gap-2 text-sm font-extrabold text-slate-700">
        Bio
        <textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} className="min-h-28 rounded-xl border border-slate-200 px-4 py-3" maxLength={280} placeholder="What are you learning right now?" />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label htmlFor="preferred-language" className="grid gap-2 text-sm font-extrabold text-slate-700">
          Preferred language
          <select id="preferred-language" value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3">
            {languages.map((language) => (
              <option key={language}>{language}</option>
            ))}
          </select>
        </label>
        <label htmlFor="experience-level" className="grid gap-2 text-sm font-extrabold text-slate-700">
          Experience level
          <select id="experience-level" value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3">
            {experienceLevels.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
        <label htmlFor="learning-goal" className="grid gap-2 text-sm font-extrabold text-slate-700">
          Learning goal
          <select id="learning-goal" value={learningGoal} onChange={(event) => setLearningGoal(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3">
            {goals.map((goal) => (
              <option key={goal}>{goal}</option>
            ))}
          </select>
        </label>
      </div>
      <button disabled={loading} className="rounded-xl bg-lab-navy px-4 py-3 font-black text-white disabled:opacity-60">
        {loading ? "Saving..." : "Save profile"}
      </button>
      {message ? <AuthMessage type={message.type}>{message.text}</AuthMessage> : null}
    </form>
  );
}
