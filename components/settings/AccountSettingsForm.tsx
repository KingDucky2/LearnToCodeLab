"use client";

import { FormEvent, useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordGuidance } from "@/components/auth/PasswordGuidance";
import { getAuthErrorMessage, isStrongEnoughPassword } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase/browser";
import { applyDisplayPreferences, type ThemePreference } from "@/components/ThemeInitializer";

type SettingsProps = {
  email: string;
  provider: string;
  preferences: {
    ai_personalization_enabled: boolean;
    model_improvement_opt_in: boolean;
    cookie_preference: string;
  } | null;
  profile: {
    preferred_language: string | null;
    experience_level: string | null;
    learning_goal: string | null;
  } | null;
  learningPreferences: {
    theme: string;
    reduced_motion: boolean;
    lesson_difficulty: string;
    explanation_style: string;
  } | null;
};

const toLabel = (value: string) => value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
const toValue = (value: string) => value.toLowerCase().replaceAll(" ", "_");

export function AccountSettingsForm({ email, provider, preferences, profile, learningPreferences }: SettingsProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [theme, setTheme] = useState(toLabel(learningPreferences?.theme ?? "system"));
  const [reducedMotion, setReducedMotion] = useState(learningPreferences?.reduced_motion ?? false);
  const [difficulty, setDifficulty] = useState(toLabel(learningPreferences?.lesson_difficulty ?? profile?.experience_level ?? "new_coder"));
  const [detail, setDetail] = useState(toLabel(learningPreferences?.explanation_style ?? "step_by_step"));
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language ?? "JavaScript");
  const [aiPersonalization, setAiPersonalization] = useState(preferences?.ai_personalization_enabled ?? true);
  const [modelImprovement, setModelImprovement] = useState(preferences?.model_improvement_opt_in ?? false);
  const [deleteText, setDeleteText] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isStrongEnoughPassword(newPassword)) {
      setMessage({ type: "error", text: "Use a password with at least 8 characters, a letter, and a number." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading("password");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setMessage(error ? { type: "error", text: getAuthErrorMessage(error.message) } : { type: "success", text: "Password updated." });
      if (!error) {
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setLoading(null);
    }
  }

  async function savePreferences() {
    setMessage(null);
    setLoading("preferences");
    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: "error", text: "Sign in again to update settings." });
        return;
      }

      const db = supabase as any;
      const [profileResult, privacyResult, learningResult] = await Promise.all([
        db
          .from("profiles")
          .update({
            preferred_language: preferredLanguage,
            experience_level: difficulty,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id),
        db
          .from("privacy_preferences")
          .upsert({
            user_id: user.id,
            ai_personalization_enabled: aiPersonalization,
            model_improvement_opt_in: modelImprovement,
            cookie_preference: preferences?.cookie_preference ?? "essential",
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" }),
        db
          .from("learning_preferences")
          .upsert({
            user_id: user.id,
            theme: toValue(theme),
            reduced_motion: reducedMotion,
            lesson_difficulty: toValue(difficulty),
            explanation_style: toValue(detail),
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" })
      ]);

      const error = profileResult.error ?? privacyResult.error ?? learningResult.error;
      if (error) {
        setMessage({ type: "error", text: getAuthErrorMessage(error.message) });
        return;
      }

      const normalizedTheme = toValue(theme) as ThemePreference;
      localStorage.setItem("ltcl:theme", normalizedTheme);
      localStorage.setItem("ltcl:reduced-motion", String(reducedMotion));
      applyDisplayPreferences(normalizedTheme, reducedMotion);
      setMessage({ type: "success", text: "Settings saved." });
    } finally {
      setLoading(null);
    }
  }

  async function signOutEverywhere() {
    setMessage(null);
    setLoading("signout");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        setMessage({ type: "error", text: getAuthErrorMessage(error.message) });
        return;
      }
      window.location.href = "/";
    } finally {
      setLoading(null);
    }
  }

  async function deleteAccount() {
    setMessage(null);
    if (deleteText !== "DELETE") {
      setMessage({ type: "error", text: "Type DELETE to confirm account deletion." });
      return;
    }

    setLoading("delete");
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteText })
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage({ type: "error", text: body.message ?? "Account deletion is not configured yet." });
        return;
      }
      window.location.href = "/";
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      {message ? <AuthMessage type={message.type}>{message.text}</AuthMessage> : null}

      <section className="surface-panel">
        <h2 className="text-2xl font-black text-foreground">Security</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-surface-interactive p-4">
            <p className="text-xs font-black uppercase text-subtle">Account email</p>
            <p className="mt-1 font-black text-foreground">{email}</p>
          </div>
          <div className="rounded-lg bg-surface-interactive p-4">
            <p className="text-xs font-black uppercase text-subtle">Google connection</p>
            <p className="mt-1 font-black text-foreground">{provider === "google" ? "Connected" : "Not connected"}</p>
          </div>
        </div>
        <form onSubmit={changePassword} className="mt-5 grid gap-3">
          <PasswordField id="settings-new-password" label="Change password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" placeholder="New password" />
          <PasswordGuidance password={newPassword} />
          <PasswordField id="settings-confirm-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="Repeat new password" />
          <button disabled={loading === "password"} className="btn-primary">
            {loading === "password" ? "Updating..." : "Update password"}
          </button>
        </form>
        <button onClick={signOutEverywhere} disabled={loading === "signout"} className="mt-3 btn-outline">
          {loading === "signout" ? "Signing out..." : "Sign out all sessions"}
        </button>
      </section>

      <section className="surface-panel">
        <h2 className="text-2xl font-black text-foreground">Preferences</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            ["Theme", theme, setTheme, ["System", "Light", "Dark"]],
            ["Lesson difficulty", difficulty, setDifficulty, ["New coder", "Some basics", "Building projects", "Advanced"]],
            ["Explanation detail", detail, setDetail, ["Short", "Step by step", "Deep dive"]],
            ["Preferred coding language", preferredLanguage, setPreferredLanguage, ["HTML", "CSS", "JavaScript", "Python", "C++", "Swift", "Lua"]]
          ].map(([label, value, setter, options]) => (
            <label key={label as string} className="form-label">
              {label as string}
              <select value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="form-control">
                {(options as string[]).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label className="form-choice mt-4">
          <input checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4" />
          Reduce motion where possible
        </label>
        <button onClick={savePreferences} disabled={loading === "preferences"} className="mt-4 btn-primary">
          {loading === "preferences" ? "Saving..." : "Save preferences"}
        </button>
      </section>

      <section className="surface-panel">
        <h2 className="text-2xl font-black text-foreground">Privacy</h2>
        <div className="mt-4 grid gap-3">
          <label className="form-choice">
            <input checked={aiPersonalization} onChange={(event) => setAiPersonalization(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4" />
            AI personalization for lesson recommendations
          </label>
          <label className="form-choice">
            <input checked={modelImprovement} onChange={(event) => setModelImprovement(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4" />
            Optional anonymized model-improvement consent
          </label>
        </div>
        <button onClick={savePreferences} disabled={loading === "preferences"} className="mt-4 btn-outline">
          Save privacy choices
        </button>
        <div className="mt-5 rounded-lg bg-surface-interactive p-4">
          <p className="font-black text-foreground">Data export</p>
          <p className="mt-1 text-sm text-muted">Export requests will be handled from this settings area when the account data export worker is connected.</p>
        </div>
      </section>

      <section className="danger-panel p-6">
        <h2 className="text-2xl font-black text-danger">Delete account</h2>
        <p className="mt-2 text-sm font-bold text-secondary">This requires explicit confirmation and a server-only Supabase service-role key configured in Vercel. The key is never exposed to browser code.</p>
        <label htmlFor="delete-confirm" className="form-label mt-4">
          Type DELETE to confirm
          <input id="delete-confirm" value={deleteText} onChange={(event) => setDeleteText(event.target.value)} className="form-control" autoComplete="off" />
        </label>
        <button onClick={deleteAccount} disabled={loading === "delete"} className="btn-danger mt-4">
          {loading === "delete" ? "Requesting deletion..." : "Delete account"}
        </button>
      </section>
    </div>
  );
}
