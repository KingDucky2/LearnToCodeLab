"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Play, RotateCcw, Save, Trash2 } from "lucide-react";
import { CourseNavigation } from "@/components/learning/CourseNavigation";
import { LessonContent } from "@/components/lesson/LessonContent";
import type { ConsoleEntry } from "@/components/preview/LivePreview";
import { getLessonHref } from "@/lib/learning/catalog";
import type { LessonFile, LessonLocation } from "@/lib/learning/types";
import { validateLessonFiles, type ValidationResult } from "@/lib/validation/lesson-validation";

const MonacoCodeEditor = dynamic(() => import("@/components/editor/MonacoCodeEditor"), { ssr: false, loading: () => <WorkspaceLoading label="Loading code editor…" /> });
const LivePreview = dynamic(() => import("@/components/preview/LivePreview"), { ssr: false, loading: () => <WorkspaceLoading label="Loading secure preview…" /> });

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export function LearningWorkspace({ location, restoredFiles, signedIn, initiallyCompleted, completedLessonIds }: { location: LessonLocation; restoredFiles: Record<string, string>; signedIn: boolean; initiallyCompleted: boolean; completedLessonIds: string[] }) {
  const { course, module, lesson, previous, next } = location;
  const initial = useMemo(() => lesson.starterFiles.map((file) => ({ ...file, content: restoredFiles[file.name] ?? file.content })), [lesson, restoredFiles]);
  const [files, setFiles] = useState<LessonFile[]>(initial);
  const [previewFiles, setPreviewFiles] = useState(() => toFileRecord(initial));
  const [activeFile, setActiveFile] = useState(initial[0]?.name ?? "index.html");
  const [runVersion, setRunVersion] = useState(0);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(signedIn ? "idle" : "idle");
  const [saveMessage, setSaveMessage] = useState(signedIn ? "Autosave is ready." : "Sign in to save and resume this lesson.");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [completed, setCompleted] = useState(initiallyCompleted);
  const abortRef = useRef<AbortController | null>(null);
  const consoleRef = useRef<ConsoleEntry[]>([]);
  const mountedRef = useRef(false);

  const save = useCallback(async (markCompleted = false, currentFiles = files) => {
    if (!signedIn) return false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSaveStatus("saving");
    setSaveMessage(markCompleted ? "Completing lesson…" : "Saving…");
    try {
      const response = await fetch("/api/learning/progress", { method: "PUT", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ courseSlug: course.slug, moduleSlug: module.slug, lessonSlug: lesson.slug, files: toFileRecord(currentFiles), completed: markCompleted }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.message === "string" ? payload.message : "Your work could not be saved.");
      setSaveStatus("saved");
      setSaveMessage(markCompleted ? "Lesson completed and saved." : "Saved just now.");
      if (markCompleted) setCompleted(true);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return false;
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : "Your work could not be saved.");
      return false;
    }
  }, [course.slug, files, lesson.slug, module.slug, signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      void save(false, initial);
      return;
    }
    if (saveStatus !== "dirty") return;
    const timer = window.setTimeout(() => { void save(false); }, 1_200);
    return () => window.clearTimeout(timer);
  }, [files, initial, save, saveStatus, signedIn]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const appendConsole = useCallback((entry: Omit<ConsoleEntry, "id">) => {
    const next = [...consoleRef.current.slice(-99), { ...entry, id: Date.now() + Math.random() }];
    consoleRef.current = next;
    setConsoleEntries(next);
  }, []);

  const updateFile = (name: string, content: string) => {
    setFiles((current) => current.map((file) => file.name === name ? { ...file, content } : file));
    setSaveStatus(signedIn ? "dirty" : "idle");
    setSaveMessage(signedIn ? "Unsaved changes" : "Sign in to save and resume this lesson.");
    setValidation(null);
  };

  const run = () => {
    consoleRef.current = [];
    setConsoleEntries([]);
    setPreviewFiles(toFileRecord(files));
    setRunVersion((version) => version + 1);
  };

  const checkWork = async () => {
    run();
    await new Promise((resolve) => window.setTimeout(resolve, 200));
    const result = validateLessonFiles(toFileRecord(files), lesson.validationRules, consoleRef.current);
    setValidation(result);
    if (result.passed) await save(true);
  };

  const reset = () => {
    if (!window.confirm("Reset every lesson file to its starter code? Your current edits will be replaced.")) return;
    const resetFiles = lesson.starterFiles.map((file) => ({ ...file }));
    setFiles(resetFiles);
    setPreviewFiles(toFileRecord(resetFiles));
    setValidation(null);
    consoleRef.current = [];
    setConsoleEntries([]);
    setSaveStatus(signedIn ? "dirty" : "idle");
    setSaveMessage(signedIn ? "Starter code restored. Saving…" : "Starter code restored.");
  };

  return (
    <main className="mx-auto w-[min(1600px,calc(100%_-_24px))] min-w-0 py-5 sm:py-7">
      <nav aria-label="Breadcrumb" className="mb-4 flex min-w-0 flex-wrap items-center gap-2 text-sm font-bold text-muted"><Link href="/learn" className="hover:text-foreground">Courses</Link><span aria-hidden="true">/</span><Link href={`/learn/${course.slug}`} className="hover:text-foreground">{course.title}</Link><span aria-hidden="true">/</span><span aria-current="page" className="text-foreground">{lesson.title}</span></nav>
      <div className="grid min-w-0 gap-4 2xl:grid-cols-[260px_minmax(0,1fr)_minmax(420px,.95fr)]">
        <CourseNavigation course={course} activeLessonId={lesson.id} completedLessonIds={completed ? [...new Set([...completedLessonIds, lesson.id])] : completedLessonIds} />
        <div className="min-w-0"><LessonContent lesson={lesson} /><div className="mt-4 flex flex-wrap items-center justify-between gap-3">{previous ? <Link className="btn-outline" href={getLessonHref(course.slug, previous.moduleSlug, previous.lessonSlug)}><ArrowLeft className="h-4 w-4" aria-hidden="true" />{previous.title}</Link> : <span />}{next ? <Link className="btn-primary" href={getLessonHref(course.slug, next.moduleSlug, next.lessonSlug)}>{next.title}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : <Link className="btn-primary" href={`/learn/${course.slug}`}>Course overview</Link>}</div></div>
        <aside className="min-w-0 overflow-hidden rounded-lg border border-slate-700 bg-[#07101d] 2xl:sticky 2xl:top-[var(--app-header-clearance)] 2xl:max-h-[calc(100dvh-var(--app-header-clearance)-1rem)] 2xl:overflow-y-auto" aria-label="Coding workspace">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-3 py-2 text-white"><div><p className="text-sm font-black">Lesson workspace</p><p className={`text-xs ${saveStatus === "error" ? "text-red-300" : saveStatus === "saved" ? "text-emerald-300" : "text-slate-300"}`} aria-live="polite">{saveStatus === "saving" ? "Saving…" : saveMessage}</p></div><div className="flex items-center gap-1"><button type="button" onClick={reset} className="btn-ghost min-h-9 px-2 text-xs text-slate-200"><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset</button><button type="button" onClick={run} className="btn-secondary min-h-9 px-3 text-xs"><Play className="h-4 w-4" aria-hidden="true" />Run</button></div></div>
          <div className="grid min-h-0 2xl:grid-rows-[minmax(22rem,1.1fr)_minmax(20rem,.9fr)]">
            <MonacoCodeEditor files={files} activeFile={activeFile} onActiveFile={setActiveFile} onChange={updateFile} />
            <div className="grid min-h-0 border-t border-slate-700 lg:grid-cols-[minmax(0,1fr)_minmax(220px,.55fr)] 2xl:grid-cols-1 2xl:grid-rows-[minmax(14rem,1fr)_minmax(9rem,.55fr)]">
              <LivePreview files={previewFiles} runVersion={runVersion} onConsole={appendConsole} />
              <ConsolePanel entries={consoleEntries} onClear={() => { consoleRef.current = []; setConsoleEntries([]); }} />
            </div>
          </div>
          <div className="border-t border-slate-700 bg-slate-950 p-3"><button type="button" onClick={checkWork} className="btn-primary w-full"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{completed ? "Check again" : "Check work and complete"}</button>{validation ? <div className={`mt-3 rounded-lg p-3 text-sm ${validation.passed ? "bg-emerald-950 text-emerald-100" : "bg-amber-950 text-amber-100"}`} role="status"><p className="font-black">{validation.passed ? "Great work — every requirement passed." : "Almost there. Review these requirements:"}</p><ul className="mt-2 grid gap-1">{validation.checks.map((check) => <li key={check.message} className="flex gap-2">{check.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-label="Passed" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-label="Needs attention" />}{check.message}</li>)}</ul></div> : null}</div>
        </aside>
      </div>
    </main>
  );
}

function ConsolePanel({ entries, onClear }: { entries: ConsoleEntry[]; onClear: () => void }) {
  return <section className="flex min-h-[10rem] min-w-0 flex-col bg-slate-950 text-slate-100" aria-label="Console"><div className="flex items-center justify-between border-b border-slate-700 px-3 py-2"><span className="text-xs font-black uppercase tracking-wide">Console</span><button type="button" onClick={onClear} className="btn-ghost min-h-8 px-2 text-xs text-slate-300"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear</button></div><div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-xs" aria-live="polite">{entries.length ? entries.map((entry) => <p key={entry.id} className={`border-b border-slate-800 py-1.5 break-words ${entry.level === "error" ? "text-red-300" : entry.level === "warn" ? "text-amber-300" : "text-slate-200"}`}><span className="mr-2 uppercase text-[10px] opacity-70">{entry.level}</span>{entry.text}</p>) : <p className="text-slate-500">Run your project to see console output and runtime errors.</p>}</div></section>;
}

function WorkspaceLoading({ label }: { label: string }) {
  return <div className="flex min-h-[20rem] items-center justify-center bg-[#07101d] p-6 text-sm font-bold text-slate-300" role="status">{label}</div>;
}

function toFileRecord(files: LessonFile[]) {
  return Object.fromEntries(files.map((file) => [file.name, file.content]));
}
