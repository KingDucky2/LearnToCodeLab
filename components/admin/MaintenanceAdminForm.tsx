"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { clampProgress, type MaintenanceSettings, type MaintenanceTask, type MaintenanceUpdate } from "@/lib/maintenance";

type Props = { initialSettings: MaintenanceSettings; initialTasks: MaintenanceTask[]; initialUpdates: MaintenanceUpdate[]; lastUpdatedBy: string | null };
const adminDateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export function MaintenanceAdminForm({ initialSettings, initialTasks, initialUpdates, lastUpdatedBy }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [tasks, setTasks] = useState(initialTasks);
  const [updates, setUpdates] = useState(initialUpdates);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify({ initialSettings, initialTasks, initialUpdates }));
  const [loading, setLoading] = useState(false);
  const [confirmEnable, setConfirmEnable] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const dirty = useMemo(() => JSON.stringify({ initialSettings: settings, initialTasks: tasks, initialUpdates: updates }) !== savedSnapshot, [savedSnapshot, settings, tasks, updates]);

  useEffect(() => {
    if (!confirmEnable) return;
    confirmButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setConfirmEnable(false);
        setSettings((current) => ({ ...current, maintenance_enabled: false }));
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmEnable]);

  function updateSetting<K extends keyof MaintenanceSettings>(key: K, value: MaintenanceSettings[K]) { setSettings((current) => ({ ...current, [key]: value })); }
  function updateTask(id: string, patch: Partial<MaintenanceTask>) { setTasks((items) => items.map((task) => task.id === id ? { ...task, ...patch } : task)); }
  function updateUpdate(id: string, patch: Partial<MaintenanceUpdate>) { setUpdates((items) => items.map((update) => update.id === id ? { ...update, ...patch } : update)); }
  function moveTask(index: number, direction: -1 | 1) { const next = [...tasks]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setTasks(next); }

  async function save(nextSettings = settings) {
    setLoading(true); setMessage(null);
    try {
      const response = await fetch("/api/admin/maintenance", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: nextSettings, tasks, updates }) });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) { setMessage({ type: "error", text: body.message ?? "Maintenance controls could not be saved." }); return; }
      setSettings(nextSettings);
      setSavedSnapshot(JSON.stringify({ initialSettings: nextSettings, initialTasks: tasks, initialUpdates: updates }));
      setMessage({ type: "success", text: body.message ?? "Maintenance controls saved." });
      router.refresh();
    } finally { setLoading(false); setConfirmEnable(false); }
  }

  function requestMode(enabled: boolean) {
    const next = { ...settings, maintenance_enabled: enabled };
    if (enabled) { setSettings(next); setConfirmEnable(true); } else void save(next);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
        <div><p className="font-black text-foreground">Current status: <span className={settings.maintenance_enabled ? "text-amber-700" : "text-emerald-700"}>{settings.maintenance_enabled ? "Maintenance enabled" : "Site online"}</span></p><p className="text-sm text-subtle">Last updated {settings.updated_at ? `${adminDateFormatter.format(new Date(settings.updated_at))} UTC` : "not yet"}{lastUpdatedBy ? ` by ${lastUpdatedBy}` : ""}</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/admin/maintenance/preview" className="inline-flex items-center gap-2 btn-outline"><Eye className="h-4 w-4" />Preview</Link><button onClick={() => requestMode(!settings.maintenance_enabled)} disabled={loading} className={`rounded-lg px-4 py-3 font-black text-white ${settings.maintenance_enabled ? "bg-emerald-700" : "bg-amber-700"}`}>{settings.maintenance_enabled ? "Disable maintenance" : "Enable maintenance"}</button></div>
      </div>
      {dirty ? <AuthMessage type="info">You have unsaved changes.</AuthMessage> : null}{message ? <AuthMessage type={message.type}>{message.text}</AuthMessage> : null}

      <section className="grid gap-5 border-b border-border pb-7">
        <div><h2 className="text-2xl font-black text-foreground">Message and status</h2><p className="text-muted">Control the public headline, explanation, badge, timing, and overall progress.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Maintenance title"><input value={settings.maintenance_title} onChange={(e) => updateSetting("maintenance_title", e.target.value)} /></Field>
          <Field label="Status badge"><input value={settings.maintenance_badge_text} onChange={(e) => updateSetting("maintenance_badge_text", e.target.value)} /></Field>
          <Field label="Internal status"><input value={settings.maintenance_status} onChange={(e) => updateSetting("maintenance_status", e.target.value)} /></Field>
          <Field label="Estimated return (UTC)"><input type="datetime-local" value={settings.estimated_return_at ? settings.estimated_return_at.slice(0, 16) : ""} onChange={(e) => updateSetting("estimated_return_at", e.target.value ? `${e.target.value}:00.000Z` : null)} /></Field>
        </div>
        <Field label="Public message"><textarea rows={4} value={settings.maintenance_message} onChange={(e) => updateSetting("maintenance_message", e.target.value)} /></Field>
        <div className="grid gap-4 md:grid-cols-2"><Field label={`Overall progress: ${settings.progress_percent}%`}><input type="range" min="0" max="100" value={settings.progress_percent} onChange={(e) => updateSetting("progress_percent", clampProgress(Number(e.target.value)))} /></Field><Field label="Auto-refresh interval (seconds)"><input type="number" min="15" max="3600" value={settings.auto_refresh_interval_seconds} onChange={(e) => updateSetting("auto_refresh_interval_seconds", Number(e.target.value))} /></Field></div>
      </section>

      <section className="grid gap-4 border-b border-border pb-7"><div><h2 className="text-2xl font-black text-foreground">Access and display</h2><p className="text-muted">These switches determine who can enter and what visitors see.</p></div><div className="grid gap-3 md:grid-cols-2">{([
        ["show_countdown", "Show live countdown"], ["show_progress", "Show overall progress"], ["allow_login_during_maintenance", "Keep learner login available"], ["allow_authenticated_users", "Allow signed-in learners"], ["allow_admin_bypass", "Allow admins across the public site"], ["show_personalized_message", "Show personalized greeting"], ["show_saved_progress_message", "Show saved-progress reassurance"], ["auto_refresh_enabled", "Automatically reopen the site"]
      ] as const).map(([key, label]) => <Toggle key={key} label={label} checked={settings[key]} onChange={(checked) => updateSetting(key, checked)} />)}</div><div className="grid gap-4 md:grid-cols-2"><Field label="Support message"><input value={settings.support_message ?? ""} onChange={(e) => updateSetting("support_message", e.target.value || null)} /></Field><Field label="Contact email"><input type="email" value={settings.contact_email ?? ""} onChange={(e) => updateSetting("contact_email", e.target.value || null)} /></Field></div></section>

      <section className="grid gap-4 border-b border-border pb-7"><div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-black text-foreground">Maintenance tasks</h2><p className="text-muted">Order and publish the work visitors can follow.</p></div><button onClick={() => setTasks((items) => [...items, { id: crypto.randomUUID(), title: "New task", description: "", status: "waiting", progress_percent: 0, display_order: items.length * 10, visible: true }])} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 font-black text-foreground"><Plus className="h-4 w-4" />Add task</button></div><div className="grid gap-3">{tasks.map((task, index) => <div key={task.id} className="grid gap-3 rounded-lg border border-border p-4"><div className="grid gap-3 md:grid-cols-[1fr_180px]"><input aria-label="Task title" value={task.title} onChange={(e) => updateTask(task.id, { title: e.target.value })} /><select aria-label="Task status" value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as MaintenanceTask["status"] })}><option value="waiting">Waiting</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="delayed">Delayed</option></select></div><textarea aria-label="Task description" rows={2} value={task.description ?? ""} onChange={(e) => updateTask(task.id, { description: e.target.value })} /><div className="flex flex-wrap items-center gap-3"><input aria-label="Task progress" className="min-w-40 flex-1" type="range" min="0" max="100" value={task.progress_percent ?? 0} onChange={(e) => updateTask(task.id, { progress_percent: clampProgress(Number(e.target.value)) })} /><span className="text-sm font-black">{task.progress_percent ?? 0}%</span><Toggle compact label="Visible" checked={task.visible} onChange={(visible) => updateTask(task.id, { visible })} /><IconButton label="Move task up" disabled={index === 0} onClick={() => moveTask(index, -1)}><ArrowUp /></IconButton><IconButton label="Move task down" disabled={index === tasks.length - 1} onClick={() => moveTask(index, 1)}><ArrowDown /></IconButton><IconButton label="Delete task" onClick={() => setTasks((items) => items.filter((item) => item.id !== task.id))}><Trash2 /></IconButton></div></div>)}</div></section>

      <section className="grid gap-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-black text-foreground">Update log</h2><p className="text-muted">Publish short progress notes during longer maintenance windows.</p></div><button onClick={() => setUpdates((items) => [{ id: crypto.randomUUID(), title: "Maintenance update", message: "", published_at: new Date().toISOString(), visible: true }, ...items])} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 font-black text-foreground"><Plus className="h-4 w-4" />Add update</button></div>{updates.map((update) => <div key={update.id} className="grid gap-3 rounded-lg border border-border p-4"><input aria-label="Update title" value={update.title} onChange={(e) => updateUpdate(update.id, { title: e.target.value })} /><textarea aria-label="Update message" rows={2} value={update.message} onChange={(e) => updateUpdate(update.id, { message: e.target.value })} /><div className="flex items-center justify-between gap-3"><Toggle compact label="Visible" checked={update.visible} onChange={(visible) => updateUpdate(update.id, { visible })} /><IconButton label="Delete update" onClick={() => setUpdates((items) => items.filter((item) => item.id !== update.id))}><Trash2 /></IconButton></div></div>)}</section>

      <div className="sticky bottom-3 flex justify-end"><button onClick={() => void save()} disabled={loading || !dirty} className="btn-primary shadow-lab"><Save className="h-4 w-4" />{loading ? "Saving..." : "Save changes"}</button></div>

      {confirmEnable ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="enable-title" aria-describedby="enable-description"><div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-2xl"><h2 id="enable-title" className="text-2xl font-black text-foreground">Enable maintenance mode?</h2><p id="enable-description" className="mt-3 text-muted">Public visitors will be redirected. Staff sign-in and verified admin controls always remain available; learner login follows the current access setting.</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => { setConfirmEnable(false); updateSetting("maintenance_enabled", false); }} className="btn-outline">Cancel</button><button ref={confirmButtonRef} onClick={() => void save(settings)} disabled={loading} className="rounded-lg bg-amber-700 px-4 py-3 font-black text-white">{loading ? "Enabling..." : "Enable maintenance"}</button></div></div></div> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="form-label">{label}<span className="[&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-border [&>input]:px-4 [&>input]:py-3 [&>textarea]:w-full [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:border-border [&>textarea]:px-4 [&>textarea]:py-3">{children}</span></label>; }
function Toggle({ label, checked, onChange, compact = false }: { label: string; checked: boolean; onChange: (value: boolean) => void; compact?: boolean }) { return <label className={`flex items-center gap-3 font-bold text-secondary ${compact ? "text-sm" : "rounded-lg border border-border p-4"}`}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />{label}</label>; }
function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) { return <button aria-label={label} title={label} onClick={onClick} disabled={disabled} className="btn-icon btn-outline h-10 w-10 [&>svg]:h-4 [&>svg]:w-4">{children}</button>; }
