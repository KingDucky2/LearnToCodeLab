"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { learningPaths } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/browser";
import { getAuthErrorMessage } from "@/lib/auth-utils";

const experienceLevels = ["Completely new", "Know a little", "Intermediate", "Advanced", "Not sure - assess me"];
const goals = ["Build websites", "Build games", "Make mobile apps", "Learn fundamentals", "Prepare for school", "Improve debugging", "Prepare for a coding job"];
const preferences = ["Detailed explanations", "More examples", "More practice", "Visual explanations", "Project-based learning", "Faster pace", "Step-by-step guidance"];

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState(experienceLevels[4]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["Build websites", "Improve debugging"]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(["More practice", "Step-by-step guidance"]);
  const [languageExperience, setLanguageExperience] = useState<Record<string, string>>(() => Object.fromEntries(learningPaths.map((path) => [path.slug, "Never used it"])));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const steps = useMemo(() => ["Experience", "Languages", "Goals", "Preferences", "Placement"], []);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function saveLearningProfile() {
    setSaving(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: "error", text: "Sign in again to save your learning profile." });
        return;
      }

      const db = supabase as any;
      const explanationStyle = selectedPreferences.includes("Detailed explanations")
        ? "deep_dive"
        : selectedPreferences.includes("Step-by-step guidance")
          ? "step_by_step"
          : "short";
      const profileResult = await db.from("profiles").update({
        onboarding_complete: true,
        onboarding_completed: true,
        experience_level: experience,
        learning_goal: selectedGoals[0] ?? null,
        updated_at: new Date().toISOString()
      }).eq("id", user.id);
      const preferencesResult = await db.from("learning_preferences").upsert({
        user_id: user.id,
        explanation_style: explanationStyle,
        lesson_pace: selectedPreferences.includes("Faster pace") ? "fast" : "balanced",
        practice_frequency: selectedPreferences.includes("More practice") ? "frequent" : "normal",
        hint_behavior: "progressive",
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
      const languageRows = Object.entries(languageExperience).map(([language_slug, experience_level]) => ({ user_id: user.id, language_slug, experience_level }));
      const languageResult = await db.from("language_experience").upsert(languageRows, { onConflict: "user_id,language_slug" });
      const deleteGoalsResult = await db.from("learning_goals").delete().eq("user_id", user.id);
      const goalsResult = selectedGoals.length
        ? await db.from("learning_goals").insert(selectedGoals.map((goal) => ({ user_id: user.id, goal })))
        : { error: null };
      const error = profileResult.error ?? preferencesResult.error ?? languageResult.error ?? deleteGoalsResult.error ?? goalsResult.error;
      if (error) {
        setMessage({ type: "error", text: getAuthErrorMessage(error.message) });
        return;
      }

      setMessage({ type: "success", text: "Learning profile saved. Opening your dashboard..." });
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 600);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-6 flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <button key={label} onClick={() => setStep(index)} className={`rounded-full px-3 py-2 text-xs font-black ${step === index ? "bg-lab-navy text-white" : "bg-slate-100 text-slate-600"}`}>
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 ? (
        <ChoiceGrid title="How much coding have you done?" options={experienceLevels} selected={[experience]} onSelect={(value) => setExperience(value)} />
      ) : null}

      {step === 1 ? (
        <div>
          <h2 className="text-2xl font-black text-lab-navy">Set your starting point per language.</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {learningPaths.map((path) => (
              <label key={path.slug} className="rounded-2xl border border-slate-200 bg-white p-4">
                <span className="font-black text-lab-navy">{path.title}</span>
                <select className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2" value={languageExperience[path.slug]} onChange={(event) => setLanguageExperience({ ...languageExperience, [path.slug]: event.target.value })}>
                  <option>Never used it</option>
                  <option>Know the basics</option>
                  <option>Comfortable</option>
                  <option>Advanced</option>
                </select>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <ChoiceGrid title="What do you want to learn?" options={goals} selected={selectedGoals} onSelect={(value) => toggle(selectedGoals, value, setSelectedGoals)} multi />
      ) : null}

      {step === 3 ? (
        <ChoiceGrid title="How should the lab teach you?" options={preferences} selected={selectedPreferences} onSelect={(value) => toggle(selectedPreferences, value, setSelectedPreferences)} multi />
      ) : null}

      {step === 4 ? (
        <div>
          <h2 className="text-2xl font-black text-lab-navy">Placement assessment preview</h2>
          <p className="mt-3 text-slate-600">The real assessment will mix multiple choice, code reading, debugging, missing-code, and confidence questions. For this foundation, this profile is saved locally and mapped to Supabase tables in the schema.</p>
          <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-700">
            Experience: {experience}<br />
            Goals: {selectedGoals.join(", ")}<br />
            Preferences: {selectedPreferences.join(", ")}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-black text-lab-navy disabled:opacity-40">
          Back
        </button>
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="rounded-xl bg-lab-navy px-4 py-3 font-black text-white">Next</button>
        ) : (
          <button onClick={saveLearningProfile} disabled={saving} className="rounded-xl bg-gradient-to-r from-lab-teal to-lab-blue px-4 py-3 font-black text-lab-navy disabled:opacity-60">{saving ? "Saving..." : "Save learning profile"}</button>
        )}
      </div>
      {message ? <p role="status" className={`mt-4 rounded-xl p-3 text-sm font-black ${message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{message.text}</p> : null}
    </div>
  );
}

function ChoiceGrid({ title, options, selected, onSelect, multi = false }: { title: string; options: string[]; selected: string[]; onSelect: (value: string) => void; multi?: boolean }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-lab-navy">{title}</h2>
      <p className="mt-2 text-slate-600">{multi ? "Choose all that fit." : "Choose one."}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <button key={option} onClick={() => onSelect(option)} className={`rounded-2xl border p-4 text-left font-black ${selected.includes(option) ? "border-lab-blue bg-blue-50 text-lab-navy" : "border-slate-200 bg-white text-slate-700"}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
