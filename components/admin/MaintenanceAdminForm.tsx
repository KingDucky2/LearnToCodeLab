"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Clock3,
  Database,
  Eye,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { useAdminInterfaceMode } from "@/components/admin/AdminShell";
import { LocalTime } from "@/components/LocalTime";
import { clampProgress, type MaintenanceSettings, type MaintenanceTask, type MaintenanceUpdate } from "@/lib/maintenance";

type HistoryItem = { id: string; action: string; actor_kind: string; preset_key: string | null; title: string; maintenance_enabled: boolean; scheduled_start_at: string | null; scheduled_end_at: string | null; created_at: string };
type Props = { initialSettings: MaintenanceSettings; initialTasks: MaintenanceTask[]; initialUpdates: MaintenanceUpdate[]; history: HistoryItem[]; lastUpdatedBy: string | null };
type Confirmation = { title: string; description: string; actionLabel: string; tone?: "danger" | "warning"; action: () => void } | null;
type Preset = {
  id: string;
  label: string;
  title: string;
  badge: string;
  message: string;
  status: string;
  etaMinutes: number | null;
  icon: typeof RefreshCw;
};

export const maintenancePresets: Preset[] = [
  { id: "quick-restart", label: "Quick Restart", title: "We’ll be right back.", badge: "Quick restart", message: "LearnToCode Lab is restarting a few services. Your learning progress is safe.", status: "restarting", etaMinutes: 15, icon: RefreshCw },
  { id: "scheduled", label: "Scheduled Maintenance", title: "Scheduled maintenance is underway.", badge: "Scheduled maintenance", message: "We’re completing planned maintenance to keep the lab reliable and secure.", status: "scheduled", etaMinutes: 120, icon: Clock3 },
  { id: "emergency", label: "Emergency Maintenance", title: "The lab is temporarily unavailable.", badge: "Emergency maintenance", message: "We’re resolving an unexpected issue and will restore access as soon as it is safe.", status: "emergency", etaMinutes: null, icon: AlertTriangle },
  { id: "database", label: "Database Upgrade", title: "We’re upgrading the lab’s data systems.", badge: "Database upgrade", message: "LearnToCode Lab is temporarily offline while we improve database reliability and performance.", status: "database", etaMinutes: 60, icon: Database },
  { id: "database-maintenance", label: "Database Maintenance", title: "Database maintenance is underway.", badge: "Database maintenance", message: "We’re performing routine database maintenance to keep learning data reliable.", status: "database", etaMinutes: 30, icon: Database },
  { id: "api", label: "API Maintenance", title: "Connected services are being updated.", badge: "API maintenance", message: "We’re updating core services that power the learning experience.", status: "api", etaMinutes: 45, icon: Server },
  { id: "server", label: "Server Maintenance", title: "Core systems are receiving maintenance.", badge: "Server maintenance", message: "We’re maintaining the servers that keep LearnToCode Lab available and responsive.", status: "server", etaMinutes: 45, icon: Server },
  { id: "security", label: "Security Update", title: "A security update is being installed.", badge: "Security update", message: "We’re applying routine security improvements while keeping your learning progress safe.", status: "security", etaMinutes: 30, icon: Zap },
  { id: "performance", label: "Performance Upgrade", title: "The lab is getting faster.", badge: "Performance upgrade", message: "We’re improving speed and reliability across LearnToCode Lab.", status: "performance", etaMinutes: 45, icon: Zap },
  { id: "feature", label: "New Feature Deployment", title: "New improvements are being prepared.", badge: "Feature deployment", message: "We’re deploying product improvements and completing final checks.", status: "deployment", etaMinutes: 30, icon: Zap },
  { id: "bug-fix", label: "Bug Fix Deployment", title: "A reliability fix is being deployed.", badge: "Fix deployment", message: "We’re applying a focused fix and verifying that services are stable.", status: "deployment", etaMinutes: 20, icon: Wrench },
  { id: "system", label: "Full System Upgrade", title: "The lab is getting an upgrade.", badge: "System upgrade", message: "We’re improving LearnToCode Lab’s reliability and core systems.", status: "upgrading", etaMinutes: 120, icon: Zap },
];

function snapshot(settings: MaintenanceSettings, tasks: MaintenanceTask[], updates: MaintenanceUpdate[]) {
  return JSON.stringify({ settings, tasks, updates });
}

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function MaintenanceAdminForm({ initialSettings, initialTasks, initialUpdates, history, lastUpdatedBy }: Props) {
  const router = useRouter();
  const { isAdvanced } = useAdminInterfaceMode();
  const [settings, setSettings] = useState(initialSettings);
  const [tasks, setTasks] = useState(initialTasks);
  const [updates, setUpdates] = useState(initialUpdates);
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(initialSettings, initialTasks, initialUpdates));
  const [savedEnabled, setSavedEnabled] = useState(initialSettings.maintenance_enabled);
  const [lastPublishedAt, setLastPublishedAt] = useState(initialSettings.updated_at);
  const [browserReady, setBrowserReady] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const dirty = useMemo(() => snapshot(settings, tasks, updates) !== savedSnapshot, [savedSnapshot, settings, tasks, updates]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    setAdvancedOpen(isAdvanced);
  }, [isAdvanced]);
  useEffect(() => setBrowserReady(true), []);

  function updateSetting<K extends keyof MaintenanceSettings>(key: K, value: MaintenanceSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }
  function updateTask(id: string, patch: Partial<MaintenanceTask>) { setTasks((items) => items.map((task) => task.id === id ? { ...task, ...patch } : task)); setMessage(null); }
  function updateUpdate(id: string, patch: Partial<MaintenanceUpdate>) { setUpdates((items) => items.map((update) => update.id === id ? { ...update, ...patch } : update)); setMessage(null); }
  function discard() { const parsed = JSON.parse(savedSnapshot) as { settings: MaintenanceSettings; tasks: MaintenanceTask[]; updates: MaintenanceUpdate[] }; setSettings(parsed.settings); setTasks(parsed.tasks); setUpdates(parsed.updates); setMessage({ type: "info", text: "Unsaved changes discarded." }); }
  function moveTask(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= tasks.length) return; const next = [...tasks]; [next[index], next[target]] = [next[target], next[index]]; setTasks(next); }

  function applyPreset(preset: Preset) {
    setSettings((current) => ({
      ...current,
      maintenance_title: preset.title,
      maintenance_badge_text: preset.badge,
      maintenance_message: preset.message,
      maintenance_status: preset.status,
      estimated_return_at: preset.etaMinutes ? new Date(Date.now() + preset.etaMinutes * 60_000).toISOString() : null,
      show_countdown: preset.etaMinutes !== null,
      preset_key: preset.id,
      allow_authenticated_users: false,
      allow_admin_bypass: true,
      show_progress: preset.id !== "emergency",
      automatic_progress: false,
      automatic_messages: false,
      automatic_updates: false,
    }));
    setMessage({ type: "info", text: `${preset.label} applied. Review the draft, then publish when ready.` });
  }

  async function save() {
    if (!settings.maintenance_title.trim() || !settings.maintenance_message.trim()) {
      setConfirmation(null);
      setMessage({ type: "error", text: "Add a title and short message before publishing." });
      return;
    }
    if (tasks.some((task) => !task.title.trim())) { setConfirmation(null); setAdvancedOpen(true); setMessage({ type: "error", text: "Every task needs a title before you can publish." }); return; }
    if (updates.some((update) => !update.title.trim() || !update.message.trim())) { setConfirmation(null); setAdvancedOpen(true); setMessage({ type: "error", text: "Every update needs a title and message before you can publish." }); return; }
    setSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/admin/maintenance", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings, tasks, updates }) });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(body.message || "Maintenance controls could not be published.");
      setSavedSnapshot(snapshot(settings, tasks, updates));
      setSavedEnabled(settings.maintenance_enabled);
      setLastPublishedAt(new Date().toISOString());
      setMessage({ type: "success", text: body.message || "Maintenance changes published." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Maintenance controls could not be published." });
    } finally {
      setSaving(false);
      setConfirmation(null);
    }
  }

  function requestPublish() {
    const saved = JSON.parse(savedSnapshot) as { settings: MaintenanceSettings };
    const scheduleActivationChanged = Boolean(settings.scheduled_start_at && settings.scheduled_start_at !== saved.settings.scheduled_start_at);
    if (settings.maintenance_enabled === savedEnabled && !scheduleActivationChanged) { void save(); return; }
    const scheduling = !settings.maintenance_enabled && scheduleActivationChanged;
    setConfirmation({
      title: scheduling ? "Schedule maintenance mode?" : settings.maintenance_enabled ? "Enable maintenance mode?" : "Reopen the public site?",
      description: scheduling ? `Maintenance will begin automatically at ${new Date(settings.scheduled_start_at!).toLocaleString()}. Visitors will see “${settings.maintenance_title}” and learner access will be ${settings.allow_authenticated_users ? "allowed" : "blocked"}. Verified staff recovery remains available.${settings.scheduled_end_at ? ` Automatic end: ${new Date(settings.scheduled_end_at).toLocaleString()}.` : ""}` : settings.maintenance_enabled ? `Visitors will see “${settings.maintenance_title}” — ${settings.maintenance_message} ${settings.estimated_return_at ? `Estimated completion: ${new Date(settings.estimated_return_at).toLocaleString()}.` : "No completion time is promised."} Learner access is ${settings.allow_authenticated_users ? "allowed" : "blocked"}; verified staff recovery remains available.${settings.scheduled_end_at ? ` Automatic end: ${new Date(settings.scheduled_end_at).toLocaleString()}.` : ""}` : `Publishing will reopen the public site.${settings.scheduled_start_at || settings.scheduled_end_at ? " The saved schedule will remain only if it is still configured." : ""}`,
      actionLabel: scheduling ? "Confirm schedule" : settings.maintenance_enabled ? "Enable and publish" : "Disable and publish",
      tone: settings.maintenance_enabled || scheduling ? "warning" : undefined,
      action: () => void save(),
    });
  }

  useEffect(() => {
    const handleQuickAction = (event: Event) => {
      const action = (event as CustomEvent<string>).detail;
      if (action === "enable" || action === "disable") {
        updateSetting("maintenance_enabled", action === "enable");
        document.getElementById("basic")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (action === "publish") {
        requestPublish();
      }
    };
    window.addEventListener("ltcl:maintenance-action", handleQuickAction);
    return () => window.removeEventListener("ltcl:maintenance-action", handleQuickAction);
  });

  function confirmDelete(kind: "task" | "update", id: string) {
    setConfirmation({ title: `Delete this ${kind}?`, description: "This item will be removed when you publish. You can discard the draft before publishing to restore it.", actionLabel: `Delete ${kind}`, tone: "danger", action: () => { if (kind === "task") setTasks((items) => items.filter((item) => item.id !== id)); else setUpdates((items) => items.filter((item) => item.id !== id)); setConfirmation(null); } });
  }
  const closeConfirmation = useCallback(() => setConfirmation(null), []);

  return (
    <div className="grid gap-6">
      <section id="basic" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5 shadow-surface sm:p-7" aria-labelledby="maintenance-basic-title">
        <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="type-caption">Basic</p>
            <h2 id="maintenance-basic-title" className="mt-1 text-2xl font-black text-foreground">Publish a clear maintenance notice</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">Enable maintenance, explain what is happening, then publish. Everything else is optional.</p>
          </div>
          <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${settings.maintenance_enabled ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>
            <span className={`h-2 w-2 rounded-full ${settings.maintenance_enabled ? "bg-amber-600" : "bg-emerald-600"}`} aria-hidden="true" />
            {settings.maintenance_enabled ? "Maintenance draft" : "Online draft"}
          </span>
        </div>

        <div className="mt-6 grid gap-6">
          <Toggle label="Enable maintenance" help="Visitors will see the maintenance page only after you publish." checked={settings.maintenance_enabled} onChange={(value) => updateSetting("maintenance_enabled", value)} />

          <div>
            <h3 className="text-sm font-black text-foreground">Start with a preset <span className="font-normal text-subtle">(optional)</span></h3>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row"><select className="form-control" aria-label="Maintenance preset" value={settings.preset_key ?? "custom"} onChange={(event) => { const preset = maintenancePresets.find((item) => item.id === event.target.value); if (preset) applyPreset(preset); else updateSetting("preset_key", "custom"); }}><option value="custom">Custom maintenance</option>{maintenancePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select>{settings.preset_key && settings.preset_key !== "custom" ? (() => { const Icon = maintenancePresets.find((item) => item.id === settings.preset_key)?.icon ?? Wrench; return <span className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-surface-secondary px-4 text-sm font-bold text-secondary"><Icon className="h-4 w-4 text-primary" />Editable preset</span>; })() : null}</div>
          </div>

          <Field label="Title"><input required maxLength={180} value={settings.maintenance_title} onChange={(event) => updateSetting("maintenance_title", event.target.value)} /></Field>
          <Field label="Short message"><textarea required rows={4} maxLength={2000} value={settings.maintenance_message} onChange={(event) => updateSetting("maintenance_message", event.target.value)} /></Field>
          <Field label="Estimated completion time" help="Optional. Displayed in each visitor’s local time."><input type="datetime-local" suppressHydrationWarning value={browserReady ? toLocalDateTime(settings.estimated_return_at) : ""} onChange={(event) => { const value = fromLocalDateTime(event.target.value); updateSetting("estimated_return_at", value); if (value) updateSetting("show_countdown", true); }} /></Field>

          {message ? <div aria-live="polite"><AuthMessage type={message.type}>{message.text}</AuthMessage></div> : null}

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs text-subtle">Last published {lastPublishedAt ? <LocalTime value={lastPublishedAt} /> : "not yet"}{lastUpdatedBy ? ` by ${lastUpdatedBy}` : ""}</p>{dirty ? <p className="mt-1 text-xs font-bold text-blue-700" role="status">Unsaved changes</p> : null}</div>
            <div className="flex flex-wrap gap-2">
              {dirty ? <button type="button" className="btn-outline" onClick={discard} disabled={saving}><RotateCcw className="h-4 w-4" />Discard</button> : null}
              <Link href="/admin/maintenance/preview" className="btn-outline"><Eye className="h-4 w-4" />Preview saved page</Link>
              <button type="button" className="btn-primary" onClick={requestPublish} disabled={saving || !dirty}><Save className="h-4 w-4" />{saving ? "Publishing…" : dirty ? "Publish changes" : "Published"}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-surface">
        <button type="button" aria-expanded={advancedOpen} aria-controls="maintenance-advanced-panel" onClick={() => setAdvancedOpen((open) => !open)} className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-7">
          <span><span className="block font-black text-foreground">Advanced settings</span><span className="mt-0.5 block text-sm text-muted">Access, progress, tasks, updates, recovery, and customization</span></span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition-transform ${advancedOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {advancedOpen ? (
          <div id="maintenance-advanced-panel" className="grid gap-10 border-t border-border px-5 py-6 sm:px-7">
            <AdminSection title="Message details" description="Optional public status and support details.">
              <div className="grid gap-4 md:grid-cols-2"><Field label="Status badge"><input maxLength={80} value={settings.maintenance_badge_text} onChange={(event) => updateSetting("maintenance_badge_text", event.target.value)} /></Field><Field label="Internal status key"><input maxLength={80} value={settings.maintenance_status} onChange={(event) => updateSetting("maintenance_status", event.target.value)} /></Field></div>
              <div className="grid gap-4 md:grid-cols-2"><Field label="Support message"><input maxLength={500} value={settings.support_message ?? ""} onChange={(event) => updateSetting("support_message", event.target.value || null)} /></Field><Field label="Support email"><input type="email" maxLength={254} value={settings.contact_email ?? ""} onChange={(event) => updateSetting("contact_email", event.target.value || null)} /></Field></div>
            </AdminSection>

            <AdminSection title="Access rules" description="Server-enforced rules for visitors and verified staff.">
              <div className="grid gap-3 lg:grid-cols-2"><Toggle label="Keep learner login available" help="Allows login and signup unless the emergency override is active." checked={settings.allow_login_during_maintenance} onChange={(value) => updateSetting("allow_login_during_maintenance", value)} /><Toggle label="Allow signed-in learners" help="Lets authenticated learners continue to non-admin pages." checked={settings.allow_authenticated_users} onChange={(value) => updateSetting("allow_authenticated_users", value)} disabled={!settings.allow_login_during_maintenance} disabledHelp="Enable learner login first." /><Toggle label="Allow staff bypass" help="Verified admin and owner roles may bypass scheduled maintenance." checked={settings.allow_admin_bypass} onChange={(value) => updateSetting("allow_admin_bypass", value)} /><Toggle label="Personalized greeting" help="Uses only the learner’s saved display name and language." checked={settings.show_personalized_message} onChange={(value) => updateSetting("show_personalized_message", value)} /></div>
            </AdminSection>

            <AdminSection title="Progress and refresh" description="Optional progress, countdown, and page-refresh behavior.">
              <div className="grid gap-3 lg:grid-cols-2"><Toggle label="Show countdown" checked={settings.show_countdown} onChange={(value) => updateSetting("show_countdown", value)} disabled={!settings.estimated_return_at} disabledHelp="Add an estimated completion time first." /><Toggle label="Automatically reopen the site" checked={settings.auto_refresh_enabled} onChange={(value) => updateSetting("auto_refresh_enabled", value)} /><Toggle label="Show overall progress" checked={settings.show_progress} onChange={(value) => updateSetting("show_progress", value)} /><Toggle label="Saved-progress reassurance" checked={settings.show_saved_progress_message} onChange={(value) => updateSetting("show_saved_progress_message", value)} /></div>
              <div className="grid gap-4 md:grid-cols-2"><Field label={`Overall progress: ${settings.progress_percent}%`}><input className="w-full" type="range" min={0} max={100} value={settings.progress_percent} onChange={(event) => updateSetting("progress_percent", clampProgress(Number(event.target.value)))} /></Field><Field label="Refresh interval (seconds)" help="Checks pause while the page is hidden."><input type="number" min={15} max={3600} value={settings.auto_refresh_interval_seconds} onChange={(event) => updateSetting("auto_refresh_interval_seconds", Number(event.target.value))} /></Field></div>
            </AdminSection>

            <AdminSection title="Scheduling and automation" description="Times are entered in your local timezone and stored as UTC. Automation remains tied to this maintenance event.">
              <div className="grid gap-4 md:grid-cols-2"><Field label="Automatic start"><input type="datetime-local" value={browserReady ? toLocalDateTime(settings.scheduled_start_at) : ""} onChange={(event) => updateSetting("scheduled_start_at", fromLocalDateTime(event.target.value))} /></Field><Field label="Automatic end"><input type="datetime-local" value={browserReady ? toLocalDateTime(settings.scheduled_end_at) : ""} onChange={(event) => { const end = fromLocalDateTime(event.target.value); updateSetting("scheduled_end_at", end); if (end) updateSetting("estimated_return_at", end); }} /></Field></div>
              <div><p className="type-label">Set duration from now</p><div className="mt-2 flex flex-wrap gap-2">{[[5,"5 min"],[10,"10 min"],[15,"15 min"],[30,"30 min"],[60,"1 hour"],[120,"2 hours"]].map(([minutes,label]) => <button key={minutes} type="button" className="btn-outline" onClick={() => { const start = new Date(); const end = new Date(start.getTime() + Number(minutes) * 60_000); updateSetting("scheduled_start_at", start.toISOString()); updateSetting("scheduled_end_at", end.toISOString()); updateSetting("estimated_return_at", end.toISOString()); }}>{label}</button>)}</div></div>
              <div className="grid gap-3 lg:grid-cols-3"><Toggle label="Automatic progress" help="Uses elapsed schedule time and stops at 90% until completion." checked={settings.automatic_progress} onChange={(value) => updateSetting("automatic_progress", value)} disabled={!settings.scheduled_start_at || !settings.scheduled_end_at} disabledHelp="Set a start and end first." /><Toggle label="Automatic stage messages" help="Allows calm visitor messaging based on progress." checked={settings.automatic_messages} onChange={(value) => updateSetting("automatic_messages", value)} disabled={!settings.scheduled_start_at || !settings.scheduled_end_at} disabledHelp="Set a start and end first." /><Toggle label="Milestone updates" help="Publishes at most one update at each safe milestone." checked={settings.automatic_updates} onChange={(value) => updateSetting("automatic_updates", value)} disabled={!settings.scheduled_start_at || !settings.scheduled_end_at} disabledHelp="Set a start and end first." /></div>
            </AdminSection>

            <AdminSection title="Tasks" description="Optional work items shown to visitors when published.">
              <div className="flex justify-end"><button type="button" className="btn-outline" onClick={() => setTasks((items) => [...items, { id: crypto.randomUUID(), title: "", description: "", status: "waiting", progress_percent: 0, display_order: items.length * 10, visible: true }])}><Plus className="h-4 w-4" />Add task</button></div>
              {tasks.length ? <div className="grid gap-3">{tasks.map((task, index) => <article key={task.id} className="rounded-xl bg-surface-secondary p-4"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]"><Field label={`Task ${index + 1} title`}><input maxLength={120} value={task.title} placeholder="Describe the work item" onChange={(event) => updateTask(task.id, { title: event.target.value })} /></Field><Field label="Status"><select value={task.status} onChange={(event) => updateTask(task.id, { status: event.target.value as MaintenanceTask["status"] })}><option value="waiting">Waiting</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="delayed">Paused</option></select></Field></div><Field label="Description"><textarea rows={2} maxLength={500} value={task.description ?? ""} onChange={(event) => updateTask(task.id, { description: event.target.value })} /></Field><div className="mt-3 flex flex-wrap items-center gap-2"><label className="min-w-44 flex-1 text-sm font-bold text-secondary">Progress: {task.progress_percent ?? 0}%<input className="mt-2 w-full" type="range" min={0} max={100} value={task.progress_percent ?? 0} onChange={(event) => updateTask(task.id, { progress_percent: clampProgress(Number(event.target.value)) })} /></label><Toggle compact label="Published" checked={task.visible} onChange={(visible) => updateTask(task.id, { visible })} /><IconButton label="Move task up" disabled={index === 0} onClick={() => moveTask(index, -1)}><ArrowUp /></IconButton><IconButton label="Move task down" disabled={index === tasks.length - 1} onClick={() => moveTask(index, 1)}><ArrowDown /></IconButton><IconButton label="Delete task" danger onClick={() => confirmDelete("task", task.id)}><Trash2 /></IconButton></div></article>)}</div> : <EmptyState title="No maintenance tasks" copy="Maintenance works without tasks. Add one only when visitors need progress detail." />}
            </AdminSection>

            <AdminSection title="Updates" description="Optional public updates, shown most recent first.">
              <div className="flex justify-end"><button type="button" className="btn-outline" onClick={() => setUpdates((items) => [{ id: crypto.randomUUID(), title: "", message: "", published_at: new Date().toISOString(), visible: true }, ...items])}><Plus className="h-4 w-4" />Add update</button></div>
              {updates.length ? <div className="grid gap-3">{updates.map((update) => <article key={update.id} className="rounded-xl bg-surface-secondary p-4"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]"><Field label="Update title"><input maxLength={120} value={update.title} placeholder="What changed?" onChange={(event) => updateUpdate(update.id, { title: event.target.value })} /></Field><Field label="Published at"><input type="datetime-local" value={toLocalDateTime(update.published_at)} onChange={(event) => updateUpdate(update.id, { published_at: fromLocalDateTime(event.target.value) ?? new Date().toISOString() })} /></Field></div><Field label="Message"><textarea rows={3} maxLength={1000} value={update.message} onChange={(event) => updateUpdate(update.id, { message: event.target.value })} /></Field><div className="mt-3 flex items-center justify-between gap-3"><Toggle compact label={update.visible ? "Published" : "Hidden"} checked={update.visible} onChange={(visible) => updateUpdate(update.id, { visible })} /><IconButton label="Delete update" danger onClick={() => confirmDelete("update", update.id)}><Trash2 /></IconButton></div></article>)}</div> : <EmptyState title="No maintenance updates" copy="Maintenance works without updates. Add one only when there is meaningful news." />}
            </AdminSection>

            <AdminSection title="Preview and recovery" description="Review the saved public page and the server-enforced recovery guarantees.">
              <div className="grid gap-3 md:grid-cols-2"><RecoveryItem text="Staff sign-in remains reachable during maintenance." /><RecoveryItem text="Admin and owner roles are verified by the server." /><RecoveryItem text="Emergency override can force maintenance on or off." /><RecoveryItem text="OAuth, password reset, and sign-out bypass maintenance." /></div>
              <div className="flex flex-wrap gap-2"><Link href="/admin/maintenance/preview" className="btn-outline"><Eye className="h-4 w-4" />Open saved preview</Link><Link href="/admin/activity" className="btn-outline">View activity</Link></div>
            </AdminSection>

            <AdminSection title="Maintenance history" description="A compact, append-only record of configuration, activation, and automation events.">
              {history.length ? <div className="grid gap-2">{history.map((item) => <article key={item.id} className="rounded-lg bg-surface-secondary p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="capitalize text-foreground">{item.action.replaceAll("_", " ")}</strong><LocalTime value={item.created_at} /></div><p className="mt-1 text-sm text-muted">{item.title} · {item.actor_kind === "automation" ? "Automatic action" : "Staff action"}{item.preset_key ? ` · ${item.preset_key.replaceAll("-", " ")}` : ""}</p></article>)}</div> : <EmptyState title="No maintenance history yet" copy="History will appear after the stabilization migration is applied and changes are published." />}
            </AdminSection>
          </div>
        ) : null}
      </section>

      <ConfirmDialog confirmation={confirmation} busy={saving} onCancel={closeConfirmation} />
    </div>
  );
}

function AdminSection({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <section className="grid gap-5"><div><h3 className="type-section">{title}</h3><p className="mt-1 text-sm text-muted">{description}</p></div>{children}</section>; }
function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) { return <label className="form-label">{label}{help ? <span className="font-normal text-subtle">{help}</span> : null}<span className="[&>input]:w-full [&>input]:px-4 [&>input]:py-3 [&>select]:w-full [&>select]:px-4 [&>textarea]:w-full [&>textarea]:px-4 [&>textarea]:py-3">{children}</span></label>; }
function Toggle({ label, help, checked, onChange, compact = false, disabled = false, disabledHelp }: { label: string; help?: string; checked: boolean; onChange: (value: boolean) => void; compact?: boolean; disabled?: boolean; disabledHelp?: string }) { return <label className={`flex items-start gap-3 font-bold text-secondary ${compact ? "text-sm" : "rounded-xl bg-surface-secondary p-4"}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="mt-1" /><span>{label}{help || disabledHelp ? <span className="mt-1 block text-sm font-normal text-muted">{disabled && disabledHelp ? disabledHelp : help}</span> : null}</span></label>; }
function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) { return <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={`btn-icon ${danger ? "border border-red-300 bg-red-50 text-red-800 hover:bg-red-100" : "btn-outline"}`}>{children}</button>; }
function EmptyState({ title, copy }: { title: string; copy: string }) { return <div className="rounded-xl border border-dashed border-border bg-surface-secondary p-7 text-center"><Check className="mx-auto h-7 w-7 text-subtle" /><h4 className="mt-3 font-black text-foreground">{title}</h4><p className="mx-auto mt-1 max-w-lg text-sm text-muted">{copy}</p></div>; }
function RecoveryItem({ text }: { text: string }) { return <p className="flex gap-2 rounded-xl bg-surface-secondary p-4 text-sm font-bold text-secondary"><Check className="h-5 w-5 shrink-0 text-success" />{text}</p>; }

function ConfirmDialog({ confirmation, busy, onCancel }: { confirmation: Confirmation; busy: boolean; onCancel: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!confirmation) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) { event.preventDefault(); onCancel(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [busy, confirmation, onCancel]);
  if (!confirmation) return null;
  return <div className="layer-overlay fixed inset-0 grid place-items-center bg-slate-950/65 p-4"><div ref={dialogRef} className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-copy"><h2 id="confirm-title" className="type-section">{confirmation.title}</h2><p id="confirm-copy" className="mt-3 text-muted">{confirmation.description}</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button ref={cancelRef} type="button" className="btn-outline" disabled={busy} onClick={onCancel}>Cancel</button><button type="button" disabled={busy} onClick={confirmation.action} className={confirmation.tone === "danger" || confirmation.tone === "warning" ? "btn-danger" : "btn-primary"}>{busy ? "Working…" : confirmation.actionLabel}</button></div></div></div>;
}
