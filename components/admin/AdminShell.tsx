"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink, LayoutDashboard, LogOut, Menu, ShieldCheck, Wrench, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/maintenance", label: "Maintenance", icon: Wrench, exact: false }
];

export function AdminShell({ children, user }: { children: ReactNode; user: { label: string; email: string; role: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const current = [...navigation].reverse().find((item) => item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <div data-admin-page className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
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
          <details className="group relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-bold [&::-webkit-details-marker]:hidden"><span className="grid h-7 w-7 place-items-center rounded-full bg-surface-secondary text-primary"><ShieldCheck className="h-4 w-4" /></span><span className="hidden max-w-40 truncate sm:block">{user.label}</span><span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase text-blue-900">{user.role}</span></summary>
            <div className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-surface-elevated p-3 shadow-lab"><p className="truncate font-black text-foreground">{user.label}</p><p className="truncate text-xs text-subtle">{user.email}</p><form action="/auth/sign-out" method="post" className="mt-3 border-t border-border pt-2"><button className="btn-ghost w-full justify-start" type="submit"><LogOut className="h-4 w-4" />Sign out</button></form></div>
          </details>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminPageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end"><div className="max-w-3xl"><h1 className="type-page">{title}</h1><p className="mt-2 text-muted">{description}</p></div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</div>;
}

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`rounded-xl border border-border bg-surface p-5 shadow-surface ${className}`}>{children}</section>; }
export function AdminStatusBadge({ active }: { active: boolean }) { return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${active ? "bg-amber-100 text-amber-950" : "bg-emerald-100 text-emerald-950"}`}><span className={`h-2 w-2 rounded-full ${active ? "bg-amber-600" : "bg-emerald-600"}`} />{active ? "Maintenance active" : "Site online"}</span>; }
