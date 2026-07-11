"use client";

import { useMemo, useState } from "react";
import { learningPaths } from "@/lib/curriculum";

const experienceLevels = ["Completely new", "Know a little", "Intermediate", "Advanced", "Not sure - assess me"];
const goals = ["Build websites", "Build games", "Make mobile apps", "Learn fundamentals", "Prepare for school", "Improve debugging", "Prepare for a coding job"];
const preferences = ["Detailed explanations", "More examples", "More practice", "Visual explanations", "Project-based learning", "Faster pace", "Step-by-step guidance"];

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState(experienceLevels[4]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["Build websites", "Improve debugging"]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(["More practice", "Step-by-step guidance"]);
  const [languageExperience, setLanguageExperience] = useState<Record<string, string>>(() => Object.fromEntries(learningPaths.map((path) => [path.slug, "Never used it"])));
  const [saved, setSaved] = useState(false);

  const steps = useMemo(() => ["Experience", "Languages", "Goals", "Preferences", "Placement"], []);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function saveLocalProfile() {
    localStorage.setItem("ltcl:onboarding", JSON.stringify({ experience, languageExperience, selectedGoals, selectedPreferences, completedAt: new Date().toISOString() }));
    setSaved(true);
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
          <button onClick={saveLocalProfile} className="rounded-xl bg-gradient-to-r from-lab-teal to-lab-blue px-4 py-3 font-black text-lab-navy">Save learning profile</button>
        )}
      </div>
      {saved ? <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-black text-emerald-800">Profile saved locally. Connect Supabase to persist this across devices.</p> : null}
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
