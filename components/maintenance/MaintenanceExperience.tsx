"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Check, Clock3, Database, Laptop, RefreshCw, Server, ShieldCheck, Smartphone, Tablet, Wrench, Zap } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getCountdownRemaining, safeMaintenanceReturnPath, type MaintenanceState, type MaintenanceTask } from "@/lib/maintenance";

type Props = {
  state: MaintenanceState;
  returnTo: string;
  profile: { displayName: string | null; preferredLanguage: string | null } | null;
  preview?: boolean;
  notice?: "signed-in-access-restricted";
};

const taskMeta = {
  waiting: { label: "Waiting", icon: Clock3, className: "bg-slate-100 text-slate-700" },
  in_progress: { label: "In progress", icon: RefreshCw, className: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", icon: Check, className: "bg-emerald-100 text-emerald-800" },
  delayed: { label: "Paused", icon: AlertTriangle, className: "bg-amber-100 text-amber-900" }
} as const;

const maintenanceIcons = {
  restarting: RefreshCw,
  scheduled: Clock3,
  emergency: AlertTriangle,
  database: Database,
  api: Server,
  upgrading: Zap,
} as const;

const updateDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function useCountdown(target: string | null, enabled: boolean) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled || !target) {
      setRemaining(null);
      return;
    }
    if (getCountdownRemaining(target) === null) {
      setRemaining(null);
      return;
    }
    const update = () => setRemaining(getCountdownRemaining(target));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [enabled, target]);
  return remaining;
}

export function MaintenanceExperience({ state, returnTo, profile, preview = false, notice }: Props) {
  const { settings, tasks, updates } = state;
  const remaining = useCountdown(settings.estimated_return_at, settings.show_countdown);
  const safeReturn = useMemo(() => safeMaintenanceReturnPath(returnTo), [returnTo]);
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "tablet" | "mobile">("desktop");

  useEffect(() => {
    if (preview || !settings.maintenance_enabled || !settings.auto_refresh_enabled) return;
    let mounted = true;
    let inFlight = false;
    let controller: AbortController | null = null;
    const check = async () => {
      if (!mounted || inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      controller = new AbortController();
      try {
        const response = await fetch("/api/maintenance/status", { cache: "no-store", signal: controller.signal });
        if (!response.ok || !mounted) return;
        const status = (await response.json()) as { enabled?: boolean };
        if (mounted && status.enabled === false) window.location.assign(safeReturn);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Stay on the safe maintenance page if the status check is unavailable.
      } finally {
        if (mounted) inFlight = false;
      }
    };
    const interval = window.setInterval(check, Math.max(15, settings.auto_refresh_interval_seconds) * 1000);
    const onVisibility = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted = false;
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [preview, safeReturn, settings.auto_refresh_enabled, settings.auto_refresh_interval_seconds, settings.maintenance_enabled]);

  if (!settings.maintenance_enabled && !preview) {
    return (
      <main data-maintenance-page className="maintenance-page grid min-h-screen place-items-center px-5 py-12">
        <section className="maintenance-online w-full max-w-xl border border-emerald-300 bg-surface p-8 text-center shadow-lab">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-7 w-7" aria-hidden="true" /></span>
          <h1 className="mt-5 text-3xl font-black text-foreground sm:text-4xl">The lab is online.</h1>
          <p className="mt-3 text-muted">Maintenance mode is currently off and LearnToCode Lab is ready.</p>
          <Link href={safeReturn} className="btn-primary mt-6">Return to the lab</Link>
        </section>
      </main>
    );
  }

  return (
    <main data-maintenance-page className="maintenance-page min-h-dvh px-4 py-5 sm:px-6 sm:py-8">
      {preview ? <div className="mx-auto mb-4 flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950"><div><strong className="block">Admin Preview</strong><span className="text-xs">Saved data only. Unsaved editor changes are not reflected.</span></div><div className="flex items-center gap-2" role="group" aria-label="Preview viewport"><PreviewButton label="Desktop" active={previewWidth === "desktop"} onClick={() => setPreviewWidth("desktop")}><Laptop /></PreviewButton><PreviewButton label="Tablet" active={previewWidth === "tablet"} onClick={() => setPreviewWidth("tablet")}><Tablet /></PreviewButton><PreviewButton label="Mobile" active={previewWidth === "mobile"} onClick={() => setPreviewWidth("mobile")}><Smartphone /></PreviewButton><Link href="/admin/maintenance" className="btn-outline bg-white">Return to admin</Link></div></div> : null}
      <div style={preview && previewWidth !== "desktop" ? { gridTemplateColumns: "1fr" } : undefined} className={`mx-auto grid min-h-[calc(100dvh-2.5rem)] overflow-hidden border border-border bg-surface shadow-lab transition-[max-width] ${previewWidth === "mobile" ? "max-w-[390px]" : previewWidth === "tablet" ? "max-w-3xl" : "max-w-7xl"} lg:grid-cols-[minmax(260px,.58fr)_minmax(0,1.42fr)]`}>
        <MaintenanceHero emergency={state.emergency} preview={preview} status={settings.maintenance_status} />
        <section className="maintenance-content flex flex-col p-6 sm:p-9 lg:p-12" aria-labelledby="maintenance-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MaintenanceStatusBadge text={settings.maintenance_badge_text} />
            {preview ? <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black uppercase text-amber-900">Saved preview</span> : null}
          </div>
          <h1 id="maintenance-title" className="mt-6 max-w-2xl text-3xl font-black leading-tight text-foreground sm:text-4xl">{settings.maintenance_title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{settings.maintenance_message}</p>

          {settings.show_personalized_message && profile?.displayName ? (
            <p className="mt-5 rounded-lg border border-blue-300 bg-blue-50 p-4 font-bold text-blue-950">
              Hey, {profile.displayName} — we&apos;re improving your personalized learning experience{profile.preferredLanguage ? ` and your ${profile.preferredLanguage} path` : ""}.
            </p>
          ) : null}

          {settings.show_saved_progress_message ? (
            <div className="mt-5 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p><strong>Your learning progress is safely saved.</strong> Your lessons and path will be waiting when the lab reopens.</p>
            </div>
          ) : null}

          {notice ? (
            <div className="mt-5 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950" role="status">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>This signed-in account does not have access while maintenance is active. Learner progress remains safely stored.</p>
            </div>
          ) : null}

          <MaintenanceAccessActions allowLearnerLogin={settings.allow_login_during_maintenance && !state.emergency} returnTo={safeReturn} />

          {settings.show_progress ? <MaintenanceProgress progress={settings.progress_percent} tasks={tasks} /> : null}
          {settings.show_countdown && settings.estimated_return_at ? <MaintenanceCountdown remaining={remaining} /> : null}
          {tasks.length ? <MaintenanceTaskList tasks={tasks} /> : null}

          {updates.length ? (
            <section className="mt-7" aria-labelledby="updates-title">
              <h2 id="updates-title" className="text-lg font-black text-foreground">Latest updates</h2>
              <div className="mt-3 grid gap-3">
                {updates.slice(0, 3).map((update) => (
                  <article key={update.id} className="rounded-lg border border-border bg-surface-interactive p-4">
                    <div className="flex flex-wrap justify-between gap-2"><h3 className="font-black text-foreground">{update.title}</h3><time dateTime={update.published_at} className="text-xs font-bold text-subtle">{updateDateFormatter.format(new Date(update.published_at))}</time></div>
                    <p className="mt-1 text-sm text-muted">{update.message}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <MaintenanceFooter support={settings.support_message} email={settings.contact_email} />
        </section>
      </div>
    </main>
  );
}

export function MaintenanceAccessActions({ allowLearnerLogin, returnTo }: { allowLearnerLogin: boolean; returnTo: string }) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-surface-interactive p-4" aria-labelledby="maintenance-access-title">
      <h2 id="maintenance-access-title" className="font-black text-foreground">Access during maintenance</h2>
      <p className="mt-1 text-sm text-muted">Staff recovery is always available. Learner access follows the current maintenance policy.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/staff/sign-in?next=%2Fadmin%2Fmaintenance" className="btn-outline">Staff sign in</Link>
        {allowLearnerLogin ? <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="btn-secondary">Learner sign in</Link> : null}
      </div>
    </section>
  );
}

export function MaintenanceHero({ emergency, preview, status }: { emergency: boolean; preview: boolean; status: string }) {
  const StatusIcon = maintenanceIcons[status as keyof typeof maintenanceIcons] ?? Wrench;
  return (
    <aside className="maintenance-hero relative flex min-h-64 flex-col justify-between overflow-hidden bg-lab-navy p-6 text-white sm:p-8 lg:min-h-full" aria-label="LearnToCode Lab maintenance">
      <div className="relative z-10 flex items-center gap-3 font-black"><Image src="/learntocodelab-logo-dark.png" width={52} height={52} alt="" className="h-[52px] w-[52px] rounded-lg object-cover" /><span>LearnToCode Lab</span></div>
      <div className="relative z-10 my-7 grid place-items-center">
        <div className="maintenance-logo-wrap grid aspect-square w-[min(58%,176px)] place-items-center rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur"><Image src="/learntocodelab-logo-dark.png" width={176} height={176} alt="LearnToCode Lab" className="h-full w-full rounded-lg object-cover" priority /></div>
      </div>
      <div className="relative z-10 flex items-center gap-2 text-sm font-bold text-blue-100"><StatusIcon className="h-4 w-4" aria-hidden="true" />{emergency ? "Emergency maintenance fallback" : preview ? "Previewing saved maintenance content" : "Improving the learning platform"}</div>
    </aside>
  );
}

export function MaintenanceStatusBadge({ text }: { text: string }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase text-blue-800"><span className="maintenance-pulse h-2.5 w-2.5 rounded-full bg-lab-teal" aria-hidden="true" />{text}</span>;
}

export function MaintenanceProgress({ progress, tasks }: { progress: number; tasks: MaintenanceTask[] }) {
  const completed = tasks.filter((task) => task.status === "completed").length;
  return (
    <section className="mt-7" aria-labelledby="progress-title">
      <div className="flex items-center justify-between gap-3"><h2 id="progress-title" className="text-lg font-black text-foreground">Upgrade progress</h2><span className="font-black text-primary">{progress}%</span></div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-secondary" role="progressbar" aria-label="Overall maintenance progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
      <p className="mt-2 text-sm text-subtle">Manually reported overall progress{tasks.length ? ` · ${completed} of ${tasks.length} visible tasks completed` : ""}.</p>
    </section>
  );
}

export function MaintenanceCountdown({ remaining }: { remaining: number | null }) {
  if (remaining === null) return null;
  if (remaining === 0) return <section className="mt-7 rounded-lg bg-surface-secondary p-4" aria-labelledby="countdown-expired"><h2 id="countdown-expired" className="font-black text-foreground">Maintenance should be complete soon</h2><p className="mt-1 text-sm text-muted">The estimate has passed. We are completing final checks and will reopen the lab as soon as it is ready.</p></section>;
  const seconds = Math.floor(remaining / 1000);
  const values = [{ label: "Days", value: Math.floor(seconds / 86400) }, { label: "Hours", value: Math.floor((seconds % 86400) / 3600) }, { label: "Minutes", value: Math.floor((seconds % 3600) / 60) }, { label: "Seconds", value: seconds % 60 }];
  return <section className="mt-7" aria-labelledby="countdown-title"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="countdown-title" className="text-lg font-black text-foreground">Estimated return</h2><span className="text-xs font-bold text-subtle">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(Date.now() + remaining))} local time</span></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="timer" aria-live="off">{values.map((item) => <div key={item.label} className="rounded-lg bg-surface-secondary p-3 text-center"><strong className="block text-2xl text-foreground">{String(item.value).padStart(2, "0")}</strong><span className="text-[11px] font-bold uppercase text-subtle">{item.label}</span></div>)}</div></section>;
}

export function MaintenanceTaskList({ tasks }: { tasks: MaintenanceTask[] }) {
  return <section className="mt-7" aria-labelledby="tasks-title"><h2 id="tasks-title" className="text-lg font-black text-foreground">What we&apos;re working on</h2><div className="mt-3 grid gap-3">{tasks.map((task) => { const meta = taskMeta[task.status]; const Icon = meta.icon; return <article key={task.id} className="rounded-lg border border-border bg-surface-interactive p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><h3 className="font-black text-foreground">{task.title}</h3>{task.description ? <p className="mt-1 text-sm text-muted">{task.description}</p> : null}</div><span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${meta.className}`}><Icon className={`h-3.5 w-3.5 ${task.status === "in_progress" ? "maintenance-spin" : ""}`} aria-hidden="true" />{meta.label}</span></div>{task.progress_percent !== null ? <><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-secondary" role="progressbar" aria-label={`${task.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={task.progress_percent}><div className="h-full bg-primary" style={{ width: `${task.progress_percent}%` }} /></div><span className="sr-only">{task.progress_percent}% complete</span></> : null}</article>; })}</div></section>;
}

function PreviewButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" aria-label={`${label} preview`} aria-pressed={active} title={label} onClick={onClick} className={`btn-icon bg-white [&>svg]:h-4 [&>svg]:w-4 ${active ? "border-2 border-amber-700 text-amber-900" : "border border-amber-300 text-amber-800"}`}>{children}</button>; }

export function MaintenanceFooter({ support, email }: { support: string | null; email: string | null }) {
  return <footer className="mt-auto pt-9 text-sm text-subtle"><p>{support ?? "Thank you for your patience."}</p>{email ? <a className="mt-2 inline-flex rounded font-black text-primary underline-offset-4 hover:underline focus-visible:outline-none" href={`mailto:${email}`}>Contact support</a> : null}<p className="mt-4">&copy; 2026 LearnToCode Lab. All rights reserved.</p></footer>;
}
