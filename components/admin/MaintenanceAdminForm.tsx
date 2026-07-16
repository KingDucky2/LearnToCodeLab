"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Check, Eye, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { getNextTabIndex, type TabNavigationKey } from "@/lib/accessibility";
import { clampProgress, type MaintenanceSettings, type MaintenanceTask, type MaintenanceUpdate } from "@/lib/maintenance";

type Props = { initialSettings: MaintenanceSettings; initialTasks: MaintenanceTask[]; initialUpdates: MaintenanceUpdate[]; lastUpdatedBy: string | null };
type Tab = "overview" | "message" | "access" | "schedule" | "tasks" | "updates" | "preview" | "recovery";
type Confirmation = { title: string; description: string; actionLabel: string; tone?: "danger" | "warning"; action: () => void } | null;
const tabs: { id: Tab; label: string }[] = [{ id: "overview", label: "Overview" }, { id: "message", label: "Message" }, { id: "access", label: "Access" }, { id: "schedule", label: "Schedule & progress" }, { id: "tasks", label: "Tasks" }, { id: "updates", label: "Updates" }, { id: "preview", label: "Preview" }, { id: "recovery", label: "Recovery" }];
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function snapshot(settings: MaintenanceSettings, tasks: MaintenanceTask[], updates: MaintenanceUpdate[]) { return JSON.stringify({ settings, tasks, updates }); }

export function MaintenanceAdminForm({ initialSettings, initialTasks, initialUpdates, lastUpdatedBy }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [settings, setSettings] = useState(initialSettings);
  const [tasks, setTasks] = useState(initialTasks);
  const [updates, setUpdates] = useState(initialUpdates);
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(initialSettings, initialTasks, initialUpdates));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dirty = useMemo(() => snapshot(settings, tasks, updates) !== savedSnapshot, [savedSnapshot, settings, tasks, updates]);
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  useEffect(() => {
    const requested = window.location.hash.slice(1) as Tab;
    if (tabs.some((tab) => tab.id === requested)) setActiveTab(requested);
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function updateSetting<K extends keyof MaintenanceSettings>(key: K, value: MaintenanceSettings[K]) { setSettings((current) => ({ ...current, [key]: value })); setMessage(null); }
  function updateTask(id: string, patch: Partial<MaintenanceTask>) { setTasks((items) => items.map((task) => task.id === id ? { ...task, ...patch } : task)); setMessage(null); }
  function updateUpdate(id: string, patch: Partial<MaintenanceUpdate>) { setUpdates((items) => items.map((update) => update.id === id ? { ...update, ...patch } : update)); setMessage(null); }
  function selectTab(tab: Tab) { setActiveTab(tab); window.history.replaceState(null, "", `#${tab}`); }
  function navigateTabs(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = getNextTabIndex(index, event.key as TabNavigationKey, tabs.length);
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    selectTab(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  }
  function discard() { const parsed = JSON.parse(savedSnapshot) as { settings: MaintenanceSettings; tasks: MaintenanceTask[]; updates: MaintenanceUpdate[] }; setSettings(parsed.settings); setTasks(parsed.tasks); setUpdates(parsed.updates); setMessage({ type: "info", text: "Unsaved changes discarded." }); }
  function moveTask(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= tasks.length) return; const next = [...tasks]; [next[index], next[target]] = [next[target], next[index]]; setTasks(next); }

  async function save(nextSettings = settings) {
    if (tasks.some((task) => !task.title.trim())) { setActiveTab("tasks"); setMessage({ type: "error", text: "Every task needs a title before you can save." }); return; }
    if (updates.some((update) => !update.title.trim() || !update.message.trim())) { setActiveTab("updates"); setMessage({ type: "error", text: "Every update needs a title and message before you can save." }); return; }
    setSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/admin/maintenance", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: nextSettings, tasks, updates }) });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(body.message || "Maintenance controls could not be saved.");
      setSettings(nextSettings); setSavedSnapshot(snapshot(nextSettings, tasks, updates)); setMessage({ type: "success", text: body.message || "Maintenance controls saved." }); router.refresh();
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Maintenance controls could not be saved." }); }
    finally { setSaving(false); setConfirmation(null); }
  }

  function requestMode(enabled: boolean) {
    const next = { ...settings, maintenance_enabled: enabled };
    setConfirmation({ title: enabled ? "Enable maintenance mode?" : "Reopen the public site?", description: enabled ? "Public visitors will be redirected to the maintenance page. Verified staff recovery remains available." : "Maintenance redirects will stop immediately after the saved configuration is refreshed.", actionLabel: enabled ? "Enable maintenance" : "Disable maintenance", tone: enabled ? "warning" : undefined, action: () => void save(next) });
  }
  function confirmDelete(kind: "task" | "update", id: string) { setConfirmation({ title: `Delete this ${kind}?`, description: "This item will be removed when you save the page. You can discard changes before saving to restore it.", actionLabel: `Delete ${kind}`, tone: "danger", action: () => { if (kind === "task") setTasks((items) => items.filter((item) => item.id !== id)); else setUpdates((items) => items.filter((item) => item.id !== id)); setConfirmation(null); } }); }
  const closeConfirmation = useCallback(() => setConfirmation(null), []);

  return (
    <div className="grid gap-5">
      <section className="rounded-xl border border-border bg-surface p-5 shadow-surface" aria-label="Maintenance status">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div><p className="flex items-center gap-2 font-black text-foreground"><span className={`h-2.5 w-2.5 rounded-full ${settings.maintenance_enabled ? "bg-amber-600" : "bg-emerald-600"}`} />{settings.maintenance_enabled ? "Maintenance is active" : "The public site is online"}</p><p className="mt-1 text-sm text-subtle">Last updated {settings.updated_at ? dateFormatter.format(new Date(settings.updated_at)) : "not yet"}{lastUpdatedBy ? ` by ${lastUpdatedBy}` : ""}</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/admin/maintenance/preview" className="btn-outline"><Eye className="h-4 w-4" />Preview saved page</Link><button type="button" onClick={() => requestMode(!settings.maintenance_enabled)} disabled={saving} className={settings.maintenance_enabled ? "btn-primary" : "btn-danger"}>{settings.maintenance_enabled ? "Disable maintenance" : "Enable maintenance"}</button></div>
        </div>
      </section>

      {dirty ? <div className="flex flex-col justify-between gap-3 rounded-xl border border-blue-300 bg-blue-50 p-4 text-blue-950 sm:flex-row sm:items-center" role="status"><div><p className="font-black">Unsaved changes</p><p className="text-sm">Save or discard this draft before leaving the page.</p></div><div className="flex gap-2"><button type="button" className="btn-outline border-blue-300 bg-white" onClick={discard} disabled={saving}><RotateCcw className="h-4 w-4" />Discard</button><button type="button" className="btn-primary" onClick={() => void save()} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving…" : "Save changes"}</button></div></div> : null}
      {message ? <div aria-live="polite"><AuthMessage type={message.type}>{message.text}</AuthMessage></div> : null}

      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto pb-px" role="tablist" aria-label="Maintenance settings">{tabs.map((tab, index) => <button ref={(element) => { tabRefs.current[index] = element; }} key={tab.id} id={`tab-${tab.id}`} role="tab" aria-selected={activeTab === tab.id} aria-controls={`panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} type="button" onClick={() => selectTab(tab.id)} onKeyDown={(event) => navigateTabs(event, index)} className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-black ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"}`}>{tab.label}</button>)}</div>
      </div>

      <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} tabIndex={0}>
        {activeTab === "overview" ? <AdminSection title="At a glance" description="Review the public status before editing individual settings."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Mode" value={settings.maintenance_enabled ? "Maintenance" : "Online"} /><Stat label="Progress" value={`${settings.progress_percent}%`} /><Stat label="Tasks" value={`${completedTasks} of ${tasks.length} done`} /><Stat label="Updates" value={`${updates.filter((item) => item.visible).length} published`} /></div><div className="mt-5 grid gap-3 md:grid-cols-3"><button className="surface-interactive p-4 text-left" onClick={() => selectTab("message")}><strong className="block text-foreground">Public message</strong><span className="text-sm text-muted">Headline, badge, and support copy</span></button><button className="surface-interactive p-4 text-left" onClick={() => selectTab("tasks")}><strong className="block text-foreground">Work items</strong><span className="text-sm text-muted">Progress, order, and visibility</span></button><button className="surface-interactive p-4 text-left" onClick={() => selectTab("access")}><strong className="block text-foreground">Access policy</strong><span className="text-sm text-muted">Learner and administrator entry</span></button></div></AdminSection> : null}

        {activeTab === "message" ? <AdminSection title="Public message" description="Keep the explanation direct and useful to visitors."><div className="grid gap-4 md:grid-cols-2"><Field label="Maintenance title" help="Shown as the primary public heading."><input maxLength={180} value={settings.maintenance_title} onChange={(e) => updateSetting("maintenance_title", e.target.value)} /></Field><Field label="Status badge" help="A short, visitor-friendly status."><input maxLength={80} value={settings.maintenance_badge_text} onChange={(e) => updateSetting("maintenance_badge_text", e.target.value)} /></Field></div><Field label="Public message" help="Explain what is happening without exposing internal details."><textarea rows={5} maxLength={2000} value={settings.maintenance_message} onChange={(e) => updateSetting("maintenance_message", e.target.value)} /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Support message"><input maxLength={500} value={settings.support_message ?? ""} onChange={(e) => updateSetting("support_message", e.target.value || null)} /></Field><Field label="Support email"><input type="email" maxLength={254} value={settings.contact_email ?? ""} onChange={(e) => updateSetting("contact_email", e.target.value || null)} /></Field></div></AdminSection> : null}

        {activeTab === "access" ? <AdminSection title="Access policy" description="These options affect server-enforced maintenance routing."><div className="grid gap-3 lg:grid-cols-2"><Toggle label="Keep learner login available" help="Allows the canonical login and signup routes unless emergency override is active." checked={settings.allow_login_during_maintenance} onChange={(value) => updateSetting("allow_login_during_maintenance", value)} /><Toggle label="Allow signed-in learners" help="Lets authenticated learners continue to non-admin pages during scheduled maintenance." checked={settings.allow_authenticated_users} onChange={(value) => updateSetting("allow_authenticated_users", value)} disabled={!settings.allow_login_during_maintenance} disabledHelp="Enable learner login first." /><Toggle label="Allow admins across the public site" help="Verified admin and owner roles may bypass scheduled maintenance. Emergency override still wins." checked={settings.allow_admin_bypass} onChange={(value) => updateSetting("allow_admin_bypass", value)} /><Toggle label="Show personalized greeting" help="Uses only the signed-in learner's display name and preferred language." checked={settings.show_personalized_message} onChange={(value) => updateSetting("show_personalized_message", value)} /></div></AdminSection> : null}

        {activeTab === "schedule" ? <AdminSection title="Schedule and progress" description="Times are stored in UTC and displayed to visitors in their local time."><div className="grid gap-4 md:grid-cols-2"><Field label="Estimated return (UTC)" help="Leave blank when no trustworthy estimate is available."><input type="datetime-local" value={settings.estimated_return_at ? settings.estimated_return_at.slice(0, 16) : ""} onChange={(e) => updateSetting("estimated_return_at", e.target.value ? `${e.target.value}:00.000Z` : null)} /></Field><Field label="Refresh interval (seconds)" help="Checks stop while the browser tab is hidden."><input type="number" min={15} max={3600} value={settings.auto_refresh_interval_seconds} onChange={(e) => updateSetting("auto_refresh_interval_seconds", Number(e.target.value))} /></Field></div><div className="grid gap-3 lg:grid-cols-2"><Toggle label="Show countdown" help="After the estimate passes, visitors see a clear completion-soon message." checked={settings.show_countdown} onChange={(value) => updateSetting("show_countdown", value)} disabled={!settings.estimated_return_at} disabledHelp="Add an estimated return first." /><Toggle label="Automatically reopen the site" help="Polls the lightweight status endpoint and returns visitors when maintenance ends." checked={settings.auto_refresh_enabled} onChange={(value) => updateSetting("auto_refresh_enabled", value)} /><Toggle label="Show overall progress" help="Uses the manually managed percentage below; task progress remains independent." checked={settings.show_progress} onChange={(value) => updateSetting("show_progress", value)} /><Toggle label="Show saved-progress reassurance" help="Reminds learners their lesson state is unaffected." checked={settings.show_saved_progress_message} onChange={(value) => updateSetting("show_saved_progress_message", value)} /></div><Field label={`Manual overall progress: ${settings.progress_percent}%`} help="This value is not silently calculated from tasks."><input className="w-full" type="range" min={0} max={100} value={settings.progress_percent} onChange={(e) => updateSetting("progress_percent", clampProgress(Number(e.target.value)))} /></Field></AdminSection> : null}

        {activeTab === "tasks" ? <AdminSection title="Maintenance tasks" description="Only visible tasks appear publicly. Reordering is keyboard accessible."><div className="mb-4 flex justify-end"><button type="button" className="btn-outline" onClick={() => setTasks((items) => [...items, { id: crypto.randomUUID(), title: "", description: "", status: "waiting", progress_percent: 0, display_order: items.length * 10, visible: true }])}><Plus className="h-4 w-4" />Add task</button></div>{tasks.length ? <div className="grid gap-3">{tasks.map((task, index) => <article key={task.id} className="rounded-xl border border-border bg-surface p-4"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]"><Field label={`Task ${index + 1} title`}><input maxLength={120} value={task.title} placeholder="Describe the work item" onChange={(e) => updateTask(task.id, { title: e.target.value })} /></Field><Field label="Status"><select value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as MaintenanceTask["status"] })}><option value="waiting">Waiting</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="delayed">Paused</option></select></Field></div><Field label="Description"><textarea rows={2} maxLength={500} value={task.description ?? ""} onChange={(e) => updateTask(task.id, { description: e.target.value })} /></Field><div className="mt-3 flex flex-wrap items-center gap-2"><label className="min-w-44 flex-1 text-sm font-bold text-secondary">Progress: {task.progress_percent ?? 0}%<input className="mt-2 w-full" type="range" min={0} max={100} value={task.progress_percent ?? 0} onChange={(e) => updateTask(task.id, { progress_percent: clampProgress(Number(e.target.value)) })} /></label><Toggle compact label="Published" checked={task.visible} onChange={(visible) => updateTask(task.id, { visible })} /><IconButton label="Move task up" disabled={index === 0} onClick={() => moveTask(index, -1)}><ArrowUp /></IconButton><IconButton label="Move task down" disabled={index === tasks.length - 1} onClick={() => moveTask(index, 1)}><ArrowDown /></IconButton><IconButton label="Delete task" danger onClick={() => confirmDelete("task", task.id)}><Trash2 /></IconButton></div></article>)}</div> : <EmptyState title="No maintenance tasks" copy="Visitors will not see a work-items section until you explicitly add and publish a task." action={<button type="button" className="btn-primary" onClick={() => setTasks([{ id: crypto.randomUUID(), title: "", description: "", status: "waiting", progress_percent: 0, display_order: 0, visible: true }])}><Plus className="h-4 w-4" />Add first task</button>} />}</AdminSection> : null}

        {activeTab === "updates" ? <AdminSection title="Update log" description="Updates are shown most recent first. Hidden drafts stay in the admin view."><div className="mb-4 flex justify-end"><button type="button" className="btn-outline" onClick={() => setUpdates((items) => [{ id: crypto.randomUUID(), title: "", message: "", published_at: new Date().toISOString(), visible: true }, ...items])}><Plus className="h-4 w-4" />Add update</button></div>{updates.length ? <div className="grid gap-3">{updates.map((update) => <article key={update.id} className="rounded-xl border border-border bg-surface p-4"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]"><Field label="Update title"><input maxLength={120} value={update.title} placeholder="What changed?" onChange={(e) => updateUpdate(update.id, { title: e.target.value })} /></Field><Field label="Published at (UTC)"><input type="datetime-local" value={update.published_at.slice(0, 16)} onChange={(e) => updateUpdate(update.id, { published_at: `${e.target.value}:00.000Z` })} /></Field></div><Field label="Message"><textarea rows={3} maxLength={1000} value={update.message} placeholder="Share a concise, public update." onChange={(e) => updateUpdate(update.id, { message: e.target.value })} /></Field><div className="mt-3 flex items-center justify-between gap-3"><Toggle compact label={update.visible ? "Published" : "Hidden"} checked={update.visible} onChange={(visible) => updateUpdate(update.id, { visible })} /><IconButton label="Delete update" danger onClick={() => confirmDelete("update", update.id)}><Trash2 /></IconButton></div></article>)}</div> : <EmptyState title="No maintenance updates" copy="Add an update only when there is meaningful news for visitors." action={<button type="button" className="btn-primary" onClick={() => setUpdates([{ id: crypto.randomUUID(), title: "", message: "", published_at: new Date().toISOString(), visible: true }])}><Plus className="h-4 w-4" />Add first update</button>} />}</AdminSection> : null}

        {activeTab === "preview" ? <AdminSection title="Saved visitor preview" description="The preview reads the last saved configuration. Unsaved edits on this page are not included."><div className="rounded-xl border border-dashed border-border bg-surface-secondary p-6 text-center"><Eye className="mx-auto h-8 w-8 text-primary" /><h3 className="mt-3 font-black text-foreground">Preview across desktop, tablet, and mobile</h3><p className="mx-auto mt-2 max-w-xl text-sm text-muted">Save your changes first, then open the protected preview. Preview controls never appear on the public route.</p><Link href="/admin/maintenance/preview" className="btn-primary mt-5">Open saved preview</Link></div></AdminSection> : null}

        {activeTab === "recovery" ? <AdminSection title="Recovery guarantees" description="These controls are informational; security enforcement remains on the server."><div className="grid gap-3 md:grid-cols-2"><RecoveryItem text="Staff sign-in remains reachable during maintenance." /><RecoveryItem text="Admin and owner roles are verified from Supabase." /><RecoveryItem text="Emergency override can force maintenance on or off." /><RecoveryItem text="OAuth callback, password reset, and sign-out routes bypass maintenance." /></div><div className="mt-5 danger-panel p-4"><h3 className="font-black">Emergency procedure</h3><p className="mt-1 text-sm text-muted">Use the deployment guide and existing emergency SQL procedure. There is no browser-exposed bypass token.</p></div></AdminSection> : null}
      </div>

      <ConfirmDialog confirmation={confirmation} busy={saving} onCancel={closeConfirmation} />
    </div>
  );
}

function AdminSection({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <section className="grid gap-5"><div><h2 className="type-section">{title}</h2><p className="mt-1 text-muted">{description}</p></div>{children}</section>; }
function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) { return <label className="form-label">{label}{help ? <span className="font-normal text-subtle">{help}</span> : null}<span className="[&>input]:w-full [&>input]:px-4 [&>input]:py-3 [&>select]:w-full [&>select]:px-4 [&>textarea]:w-full [&>textarea]:px-4 [&>textarea]:py-3">{children}</span></label>; }
function Toggle({ label, help, checked, onChange, compact = false, disabled = false, disabledHelp }: { label: string; help?: string; checked: boolean; onChange: (value: boolean) => void; compact?: boolean; disabled?: boolean; disabledHelp?: string }) { return <label className={`flex items-start gap-3 font-bold text-secondary ${compact ? "text-sm" : "rounded-xl border border-border bg-surface p-4"}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-1" /><span>{label}{help ? <span className="mt-1 block text-sm font-normal text-muted">{disabled && disabledHelp ? disabledHelp : help}</span> : null}</span></label>; }
function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) { return <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={`btn-icon ${danger ? "border border-red-300 bg-red-50 text-red-800 hover:bg-red-100" : "btn-outline"}`}>{children}</button>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-surface-secondary p-4"><p className="type-caption">{label}</p><p className="mt-1 text-xl font-black text-foreground">{value}</p></div>; }
function EmptyState({ title, copy, action }: { title: string; copy: string; action: ReactNode }) { return <div className="rounded-xl border border-dashed border-border bg-surface-secondary p-8 text-center"><Check className="mx-auto h-7 w-7 text-subtle" /><h3 className="mt-3 font-black text-foreground">{title}</h3><p className="mx-auto mt-1 max-w-lg text-sm text-muted">{copy}</p><div className="mt-5">{action}</div></div>; }
function RecoveryItem({ text }: { text: string }) { return <p className="flex gap-2 rounded-xl border border-border bg-surface p-4 text-sm font-bold text-secondary"><Check className="h-5 w-5 shrink-0 text-success" />{text}</p>; }

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
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [busy, confirmation, onCancel]);
  if (!confirmation) return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/65 p-4" aria-hidden="false"><div ref={dialogRef} className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-copy"><h2 id="confirm-title" className="type-section">{confirmation.title}</h2><p id="confirm-copy" className="mt-3 text-muted">{confirmation.description}</p><div className="mt-6 flex justify-end gap-2"><button ref={cancelRef} type="button" className="btn-outline" disabled={busy} onClick={onCancel}>Cancel</button><button type="button" disabled={busy} onClick={confirmation.action} className={confirmation.tone === "danger" ? "btn-danger" : confirmation.tone === "warning" ? "btn-danger" : "btn-primary"}>{busy ? "Working…" : confirmation.actionLabel}</button></div></div></div>;
}
