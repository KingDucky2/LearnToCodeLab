"use client";

import { Check, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { learningPaths } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/browser";
import { getAuthErrorMessage } from "@/lib/auth-utils";

const experienceLevels = ["Completely new", "Know a little", "Intermediate", "Advanced", "Not sure - assess me"];
const goals = ["Build websites", "Build games", "Make mobile apps", "Learn fundamentals", "Prepare for school", "Improve debugging", "Prepare for a coding job"];
const preferences = ["Detailed explanations", "More examples", "More practice", "Visual explanations", "Project-based learning", "Faster pace", "Step-by-step guidance"];
const steps = ["Experience", "Languages", "Goals", "Preferences", "Placement"];

export function OnboardingForm() {
  const router = useRouter();
  const hasMounted = useRef(false);
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState(experienceLevels[4]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["Build websites", "Improve debugging"]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(["More practice", "Step-by-step guidance"]);
  const [languageExperience, setLanguageExperience] = useState<Record<string, string>>(() => Object.fromEntries(learningPaths.map((path) => [path.slug, "Never used it"])));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    document.getElementById("onboarding-step-title")?.focus();
  }, [step]);

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

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <section className="onboarding-panel overflow-hidden rounded-lg border border-slate-700/80 bg-[#091b33] shadow-[0_24px_70px_rgba(0,0,0,0.28)]" aria-label="Learning profile setup">
      <div className="border-b border-slate-700/80 bg-[#0d223d] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-4 text-sm font-bold text-slate-300">
          <span>Step {step + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-label="Onboarding progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <div className="h-full rounded-full bg-gradient-to-r from-lab-teal to-lab-blue transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
        </div>
        <nav className="-mx-1 mt-4 overflow-x-auto px-1 pb-1" aria-label="Onboarding steps">
          <div className="flex min-w-max gap-2">
            {steps.map((label, index) => {
              const active = step === index;
              const completed = index < step;
              return (
                <button
                  type="button"
                  key={label}
                  onClick={() => setStep(index)}
                  aria-current={active ? "step" : undefined}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/40 ${
                    active
                      ? "border-lab-blue bg-lab-blue text-white shadow-[0_8px_22px_rgba(11,140,255,0.2)]"
                      : completed
                        ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15"
                        : "border-slate-600 bg-[#122a47] text-slate-300 hover:border-slate-400 hover:text-white"
                  }`}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${active ? "bg-white text-[#06172f]" : completed ? "bg-emerald-300 text-[#052e25]" : "bg-slate-600 text-white"}`}>
                    {completed ? <Check className="h-3 w-3" aria-hidden="true" /> : index + 1}
                  </span>
                  {label}
                  <span className="sr-only">{active ? ", current step" : completed ? ", completed" : ", upcoming"}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        <div className="min-h-[320px]">
          {step === 0 ? (
            <ChoiceGrid title="How much coding have you done?" options={experienceLevels} selected={[experience]} onSelect={setExperience} />
          ) : null}

          {step === 1 ? (
            <div>
              <StepHeading title="Set your starting point per language." helper="Choose the closest match for each language. You can update these later." />
              <div className="mt-6 grid auto-rows-fr gap-3 md:grid-cols-2">
                {learningPaths.map((path, index) => (
                  <label key={path.slug} className={`flex min-h-32 flex-col justify-between rounded-lg border border-slate-600 bg-[#102743] p-4 text-slate-100 ${learningPaths.length % 2 === 1 && index === learningPaths.length - 1 ? "md:col-span-2" : ""}`}>
                    <span className="font-black leading-6">{path.title}</span>
                    <select
                      aria-label={`${path.title} experience`}
                      className="mt-4 min-h-11 w-full rounded-lg border border-slate-500 bg-[#081a31] px-3 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/40"
                      value={languageExperience[path.slug]}
                      onChange={(event) => setLanguageExperience({ ...languageExperience, [path.slug]: event.target.value })}
                    >
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
              <StepHeading title="Placement assessment preview" helper="Review the learning signals we will use to shape your starting path." />
              <dl className="mt-6 grid gap-3 rounded-lg border border-slate-600 bg-[#102743] p-5 text-sm sm:grid-cols-[150px_1fr]">
                <dt className="font-black text-slate-300">Experience</dt><dd className="font-bold text-white">{experience}</dd>
                <dt className="font-black text-slate-300">Goals</dt><dd className="font-bold leading-6 text-white">{selectedGoals.length ? selectedGoals.join(", ") : "No goals selected"}</dd>
                <dt className="font-black text-slate-300">Preferences</dt><dd className="font-bold leading-6 text-white">{selectedPreferences.length ? selectedPreferences.join(", ") : "No preferences selected"}</dd>
              </dl>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex gap-3 border-t border-slate-700 pt-5 sm:justify-between">
          <button
            type="button"
            disabled={step === 0 || saving}
            onClick={() => setStep(step - 1)}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-500 bg-[#102743] px-5 py-3 font-black text-white transition-colors hover:border-slate-300 hover:bg-[#173353] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/40 disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-[#0c2038] disabled:text-slate-400 sm:flex-none sm:min-w-32"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />Back
          </button>
          {step < steps.length - 1 ? (
            <button type="button" onClick={() => setStep(step + 1)} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-lab-blue px-6 py-3 font-black text-white shadow-[0_10px_28px_rgba(11,140,255,0.24)] transition-colors hover:bg-[#0078e6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50 sm:flex-none sm:min-w-32">
              Next<ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button type="button" onClick={saveLearningProfile} disabled={saving} className="inline-flex min-h-12 flex-[1.5] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-lab-teal to-lab-blue px-6 py-3 font-black text-[#06172f] shadow-[0_10px_28px_rgba(2,201,149,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/50 disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-200 disabled:shadow-none sm:flex-none sm:min-w-56">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}{saving ? "Saving..." : "Save learning profile"}
            </button>
          )}
        </div>
        {message ? <p role="status" aria-live="polite" className={`mt-4 rounded-lg border p-3 text-sm font-black ${message.type === "success" ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-100" : "border-red-400/50 bg-red-400/10 text-red-100"}`}>{message.text}</p> : null}
      </div>
    </section>
  );
}

function StepHeading({ title, helper }: { title: string; helper: string }) {
  return (
    <div className="max-w-3xl">
      <h2 id="onboarding-step-title" tabIndex={-1} className="text-2xl font-black leading-tight text-white outline-none sm:text-3xl">{title}</h2>
      <p className="mt-2 text-base leading-7 text-slate-300">{helper}</p>
    </div>
  );
}

function ChoiceGrid({ title, options, selected, onSelect, multi = false }: { title: string; options: string[]; selected: string[]; onSelect: (value: string) => void; multi?: boolean }) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (multi || !["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + direction + options.length) % options.length;
    onSelect(options[nextIndex]);
    const optionButtons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[data-choice-option]");
    optionButtons?.[nextIndex]?.focus();
  }

  return (
    <div>
      <StepHeading title={title} helper={multi ? "Choose all that fit. You can change these later." : "Choose the answer that best describes you."} />
      <div className="mt-6 grid auto-rows-fr gap-3 md:grid-cols-2" role={multi ? "group" : "radiogroup"} aria-label={title}>
        {options.map((option, index) => {
          const isSelected = selected.includes(option);
          const spansFinalRow = options.length % 2 === 1 && index === options.length - 1;
          return (
            <button
              type="button"
              key={option}
              data-choice-option
              role={multi ? "checkbox" : "radio"}
              aria-checked={isSelected}
              tabIndex={multi || isSelected || (!selected.length && index === 0) ? 0 : -1}
              onClick={() => onSelect(option)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`group relative flex min-h-[84px] w-full items-center gap-4 rounded-lg border p-4 text-left text-base font-black leading-6 transition-[border-color,background-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/50 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none ${spansFinalRow ? "md:col-span-2" : ""} ${
                isSelected
                  ? "border-lab-blue bg-[#dff1ff] text-[#06172f] shadow-[0_8px_24px_rgba(11,140,255,0.16)]"
                  : "border-slate-600 bg-[#102743] text-slate-100 hover:border-slate-400 hover:bg-[#15304f]"
              }`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${isSelected ? "border-lab-blue bg-lab-blue text-white" : "border-slate-400 bg-transparent text-transparent group-hover:border-slate-200"}`} aria-hidden="true">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1 overflow-wrap-anywhere">{option}</span>
              <span className="sr-only">{isSelected ? "Selected" : "Not selected"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
