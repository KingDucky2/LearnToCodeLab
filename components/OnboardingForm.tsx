"use client";

import { Check, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import type { AccountIdentity } from "@/lib/identity";
import { dailyMinuteOptions, learningFormats, onboardingExperienceLevels, onboardingGoals, onboardingLanguages, validateDisplayName, validateProfileUsername } from "@/lib/profile-validation";

const steps = ["Your profile", "Experience", "Learning goals", "Starting language", "Preferences"];
const languageLabels: Record<string, string> = { html: "HTML", css: "CSS", javascript: "JavaScript", python: "Python", cpp: "C++", swift: "Swift", lua: "Lua", help_me_choose: "Help me choose" };
const formatLabels: Record<string, string> = { guided_lessons: "Guided lessons", projects: "Projects", quizzes: "Quizzes", mixed: "Mixed learning" };
const suggestions: Record<string, string[]> = { "Build websites": ["html", "css", "javascript"], "Learn programming basics": ["python", "javascript"], "Make games": ["javascript", "cpp", "lua"], "Build mobile apps": ["swift", "javascript"], "Learn Python": ["python"], "Learn JavaScript": ["javascript"], "Prepare for school": ["python", "javascript", "cpp"], "Coding careers": ["javascript", "python"], "Something else": ["help_me_choose", "python", "javascript"] };

export function OnboardingForm({ identity, profile }: { identity: AccountIdentity; profile: { display_name: string | null; username: string | null; avatar_url: string | null } }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(profile.display_name ?? identity.label);
  const [username, setUsername] = useState(profile.username ?? "");
  const [experience, setExperience] = useState<string>(onboardingExperienceLevels[0]);
  const [primaryGoal, setPrimaryGoal] = useState<string>(onboardingGoals[1]);
  const [interests, setInterests] = useState<string[]>([]);
  const [language, setLanguage] = useState("help_me_choose");
  const [dailyMinutes, setDailyMinutes] = useState<number>(20);
  const [learningFormat, setLearningFormat] = useState("mixed");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const displayValidation = useMemo(() => validateDisplayName(displayName), [displayName]);
  const usernameValidation = useMemo(() => validateProfileUsername(username), [username]);
  const progress = ((step + 1) / steps.length) * 100;
  const suggested = suggestions[primaryGoal] ?? ["help_me_choose"];

  function canContinue() {
    if (step === 0) return displayValidation.valid && usernameValidation.valid;
    return true;
  }

  async function finish() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/profile/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName, username, experience, primaryGoal, interests, language, dailyMinutes, learningFormat }) });
      const body = await response.json() as { message?: string };
      if (!response.ok) return setMessage(body.message ?? "Your learning profile could not be saved.");
      router.push("/dashboard"); router.refresh();
    } catch { setMessage("Your learning profile could not be saved. Check your connection and try again."); }
    finally { setSaving(false); }
  }

  return <section className="overflow-hidden rounded-xl border border-slate-700 bg-[#091b33] shadow-[0_24px_70px_rgba(0,0,0,0.28)]" aria-label="Required account setup">
    <header className="border-b border-slate-700 bg-[#0d223d] px-5 py-5"><div className="flex justify-between gap-3 text-sm font-bold text-slate-300"><span>Step {step + 1} of {steps.length}</span><span>{Math.round(progress)}% complete</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-gradient-to-r from-lab-teal to-lab-blue transition-[width]" style={{ width: `${progress}%` }} /></div><ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Setup steps">{steps.map((label, index) => <li key={label} className={`rounded px-1 py-2 text-center text-[10px] font-black sm:text-xs ${index === step ? "bg-blue-500 text-white" : index < step ? "bg-emerald-400/15 text-emerald-200" : "text-slate-400"}`}>{index < step ? <Check className="mx-auto h-4 w-4" /> : label}</li>)}</ol></header>
    <div className="px-5 py-7 sm:px-8"><div className="min-h-[430px]">
      {step === 0 ? <div><Heading title="Create your learner identity" helper="Choose how your name appears. Role labels are added automatically and can never be entered here." /><div className="mt-6 grid gap-5"><AvatarPicker identity={identity} hasCustomAvatar={Boolean(profile.avatar_url)} /><div className="grid gap-4 md:grid-cols-2"><Field label="Display name" feedback={displayValidation.valid ? "Looks good." : displayValidation.message} valid={displayValidation.valid}><input className="min-h-11 rounded-lg border border-slate-500 bg-[#081a31] px-3 text-white" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={40} autoComplete="name" /></Field><Field label="Username" feedback={usernameValidation.valid ? "Capitalization is preserved; uniqueness ignores case." : usernameValidation.message} valid={usernameValidation.valid}><input className="min-h-11 rounded-lg border border-slate-500 bg-[#081a31] px-3 text-white" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={20} autoComplete="username" placeholder="KingDucky2" /></Field></div></div></div> : null}
      {step === 1 ? <ChoiceStep title="How much coding experience do you have?" options={[...onboardingExperienceLevels]} value={experience} onChange={setExperience} /> : null}
      {step === 2 ? <div><ChoiceStep title="What would you like to learn first?" options={[...onboardingGoals]} value={primaryGoal} onChange={(value) => { setPrimaryGoal(value); setInterests((items) => items.filter((item) => item !== value)); setLanguage((suggestions[value] ?? ["help_me_choose"])[0]); }} /><div className="mt-6 border-t border-slate-700 pt-5"><p className="font-black text-white">Optional interests</p><p className="mt-1 text-sm text-slate-300">Choose any other goals that interest you.</p><div className="mt-3 flex flex-wrap gap-2">{onboardingGoals.filter((goal) => goal !== primaryGoal).map((goal) => <button type="button" key={goal} aria-pressed={interests.includes(goal)} className={`rounded-full border px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/50 ${interests.includes(goal) ? "border-cyan-300 bg-cyan-200 text-slate-950" : "border-slate-600 text-slate-200"}`} onClick={() => setInterests((items) => items.includes(goal) ? items.filter((item) => item !== goal) : [...items, goal])}>{goal}</button>)}</div></div></div> : null}
      {step === 3 ? <div><Heading title="Which programming language would you like to start with?" helper={`Suggested for “${primaryGoal}”: ${suggested.map((item) => languageLabels[item]).join(", ")}.`} /><div className="mt-6 grid gap-3 sm:grid-cols-2">{onboardingLanguages.map((item) => <ChoiceButton key={item} selected={language === item} onClick={() => setLanguage(item)} label={languageLabels[item]} note={suggested.includes(item) ? "Recommended for your goal" : undefined} />)}</div></div> : null}
      {step === 4 ? <div><Heading title="How should learning fit your day?" helper="These preferences shape pacing and lesson recommendations. You can change them later." /><div className="mt-6 grid gap-6 md:grid-cols-2"><div><p className="font-black text-white">Minutes per day</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{dailyMinuteOptions.map((value) => <ChoiceButton key={value} selected={dailyMinutes === value} onClick={() => setDailyMinutes(value)} label={`${value} min`} />)}</div></div><div><p className="font-black text-white">Learning style</p><div className="mt-3 grid gap-2">{learningFormats.map((value) => <ChoiceButton key={value} selected={learningFormat === value} onClick={() => setLearningFormat(value)} label={formatLabels[value]} />)}</div></div></div></div> : null}
    </div><footer className="mt-7 flex gap-3 border-t border-slate-700 pt-5"><button type="button" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-500 bg-[#102743] px-5 font-black text-white disabled:opacity-50 sm:flex-none" disabled={step === 0 || saving} onClick={() => setStep((value) => value - 1)}><ChevronLeft className="h-4 w-4" />Back</button>{step < steps.length - 1 ? <button type="button" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-lab-blue px-6 font-black text-white disabled:opacity-50 sm:ml-auto sm:flex-none" disabled={!canContinue()} onClick={() => setStep((value) => value + 1)}>Next<ChevronRight className="h-4 w-4" /></button> : <button type="button" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-lab-teal to-lab-blue px-6 font-black text-slate-950 disabled:opacity-50 sm:ml-auto sm:flex-none" disabled={saving} onClick={finish}>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? "Saving…" : "Finish setup"}</button>}</footer>{message ? <p className="mt-4 rounded-lg border border-red-400/50 bg-red-400/10 p-3 text-sm font-bold text-red-100" role="alert">{message}</p> : null}</div>
  </section>;
}

function Heading({ title, helper }: { title: string; helper: string }) { return <div><h2 className="text-2xl font-black text-white sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl leading-7 text-slate-300">{helper}</p></div>; }
function Field({ label, feedback, valid, children }: { label: string; feedback: string; valid: boolean; children: React.ReactNode }) { return <label className="grid gap-2 font-black text-white">{label}{children}<span className={`text-xs ${valid ? "text-emerald-300" : "text-red-300"}`}>{feedback}</span></label>; }
function ChoiceStep({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) { return <div><Heading title={title} helper="Choose the answer that best fits right now." /><div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={title}>{options.map((item) => <ChoiceButton key={item} selected={value === item} onClick={() => onChange(item)} label={item} />)}</div></div>; }
function ChoiceButton({ selected, onClick, label, note }: { selected: boolean; onClick: () => void; label: string; note?: string }) { return <button type="button" role="radio" aria-checked={selected} className={`flex min-h-16 items-center gap-3 rounded-lg border p-4 text-left font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/50 ${selected ? "border-cyan-300 bg-cyan-100 text-slate-950" : "border-slate-600 bg-[#102743] text-white hover:border-slate-400"}`} onClick={onClick}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-400"}`}>{selected ? <Check className="h-3 w-3" /> : null}</span><span>{label}{note ? <small className="mt-1 block font-bold text-blue-700">{note}</small> : null}</span></button>; }
