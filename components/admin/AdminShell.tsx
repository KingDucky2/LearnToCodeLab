"use client";

import Link from "next/link";
import { Activity, ChevronRight, ExternalLink, LayoutDashboard, LifeBuoy, LogOut, Menu, Settings2, Sparkles, Users, Wrench, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { AccountAvatar } from "@/components/AccountAvatar";
import type { AccountIdentity } from "@/lib/identity";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { RoleBadge } from "@/components/RoleBadge";

type AdminNavigationItem = { href: string; label: string; icon: typeof LayoutDashboard; exact: boolean };

const navigation: AdminNavigationItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, exact: false },
  { href: "/admin/maintenance", label: "Maintenance", icon: Wrench, exact: false },
  { href: "/admin/activity", label: "Activity", icon: Activity, exact: false }
];

export type AdminInterfaceMode = "beginner" | "advanced";

type AdminInterfaceModeContextValue = {
  mode: AdminInterfaceMode;
  isAdvanced: boolean;
  setMode: (mode: AdminInterfaceMode) => void;
};

const AdminInterfaceModeContext = createContext<AdminInterfaceModeContextValue | null>(null);

export function useAdminInterfaceMode() {
  const value = useContext(AdminInterfaceModeContext);
  if (!value) throw new Error("useAdminInterfaceMode must be used inside AdminShell");
  return value;
}

function AdminModeSelector({ mode, onChange }: { mode: AdminInterfaceMode; onChange: (mode: AdminInterfaceMode) => void }) {
  return <div className="rounded-lg border border-border bg-surface-secondary p-1" role="group" aria-label="Administration interface mode">
    <button type="button" className={`min-h-9 rounded-md px-3 text-xs font-black transition-colors ${mode === "beginner" ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"}`} aria-pressed={mode === "beginner"} onClick={() => onChange("beginner")}><Sparkles className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />Beginner</button>
    <button type="button" className={`min-h-9 rounded-md px-3 text-xs font-black transition-colors ${mode === "advanced" ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"}`} aria-pressed={mode === "advanced"} onClick={() => onChange("advanced")}><Settings2 className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />Advanced</button>
  </div>;
}

export function AdminShell({ children, user }: { children: ReactNode; user: { id: string; identity: AccountIdentity; role: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setModeState] = useState<AdminInterfaceMode>("beginner");
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const storageKey = `ltcl:admin-interface-mode:${user.id}`;
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      setModeState(saved === "advanced" ? "advanced" : "beginner");
    } catch {
      setModeState("beginner");
    }
  }, [storageKey]);
  const setMode = useCallback((nextMode: AdminInterfaceMode) => {
    setModeState(nextMode);
    try { window.localStorage.setItem(storageKey, nextMode); } catch { /* Browser storage can be unavailable without blocking the admin UI. */ }
  }, [storageKey]);
  const modeContext = useMemo(() => ({ mode, isAdvanced: mode === "advanced", setMode }), [mode, setMode]);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { if (accountMenuRef.current) accountMenuRef.current.open = false; }, [pathname]);
  useEffect(() => {
    const close = (event: PointerEvent) => { const menu = accountMenuRef.current; if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && accountMenuRef.current?.open) { accountMenuRef.current.open = false; accountMenuRef.current.querySelector<HTMLElement>("summary")?.focus(); } };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, []);
  const current = [...navigation].reverse().find((item) => item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <AdminInterfaceModeContext.Provider value={modeContext}>
    <div data-admin-page data-admin-mode={mode} className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <button type="button" aria-label="Close admin navigation" className={`fixed inset-0 z-40 bg-slate-950/55 lg:hidden ${open ? "block" : "hidden"}`} onClick={() => setOpen(false)} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(300px,88vw)] flex-col border-r border-slate-700 bg-lab-navy text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between gap-3 border-b border-white/10 px-5">
          <Link href="/admin" className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none"><BrandLogo /><span className="min-w-0"><strong className="block truncate text-sm">LearnToCode Lab</strong><span className="block text-xs text-blue-200">Administration</span></span></Link>
          <button type="button" className="btn-icon text-white lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="grid gap-1 p-4" aria-label="Admin navigation">
          {navigation.map(({ href, label, icon: Icon, exact }) => { const active = exact ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-none ${active ? "bg-white text-lab-navy" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</Link>; })}
        </nav>
        <div className="mt-auto border-t border-white/10 p-4">
          <Link href="/" target="_blank" className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold text-blue-100 hover:bg-white/10 hover:text-white">View public site <ExternalLink className="h-4 w-4" /></Link>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="btn-icon btn-outline lg:hidden" aria-label="Open admin navigation" aria-expanded={open} onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
            <nav className="hidden items-center gap-2 text-sm text-subtle sm:flex" aria-label="Breadcrumb"><Link href="/admin" className="rounded hover:text-foreground">Admin</Link>{current && current.href !== "/admin" ? <><ChevronRight className="h-4 w-4" /><span className="truncate font-bold text-foreground">{current.label}</span></> : null}</nav>
          </div>
          <div className="flex items-center gap-2">
          <div className="hidden lg:block"><AdminModeSelector mode={mode} onChange={setMode} /></div>
          <details ref={accountMenuRef} className="group relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-bold [&::-webkit-details-marker]:hidden"><AccountAvatar identity={user.identity} size="sm" decorative /><span className="hidden max-w-40 truncate sm:block">{user.identity.label}</span><RoleBadge role={user.role} /></summary>
            <div className="layer-dropdown absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface-elevated p-3 shadow-lab"><p className="truncate font-black text-foreground">{user.identity.label}</p><p className="truncate text-xs text-subtle">{user.identity.email}</p><form action="/auth/sign-out" method="post" className="mt-3 border-t border-border pt-2"><button className="btn-ghost w-full justify-start" type="submit"><LogOut className="h-4 w-4" />Sign out</button></form></div>
          </details>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-5 lg:hidden"><AdminModeSelector mode={mode} onChange={setMode} /></div>
          {children}
        </main>
        <AdminQuickActions />
      </div>
    </div>
    </AdminInterfaceModeContext.Provider>
  );
}

export function AdminPageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end"><div className="max-w-3xl"><h1 className="type-page">{title}</h1><p className="mt-2 text-muted">{description}</p></div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</div>;
}

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`rounded-xl border border-border bg-surface p-5 shadow-surface ${className}`}>{children}</section>; }
export function AdminStatusBadge({ active }: { active: boolean }) { return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${active ? "bg-amber-100 text-amber-950" : "bg-emerald-100 text-emerald-950"}`}><span className={`h-2 w-2 rounded-full ${active ? "bg-amber-600" : "bg-emerald-600"}`} />{active ? "Maintenance active" : "Site online"}</span>; }
