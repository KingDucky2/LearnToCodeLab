"use client";

import Link from "next/link";
import { Activity, ExternalLink, Eye, LifeBuoy, Search, ShieldCheck, UserPlus, Users, Wrench, X, Zap } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ComponentType } from "react";

type QuickAction = { href?: string; command?: "enable" | "disable" | "publish"; label: string; icon: ComponentType<{ className?: string }>; external?: boolean };

function actionsForPath(pathname: string): QuickAction[] {
  if (pathname.startsWith("/admin/support")) return [
    { href: "/support/new", label: "Create ticket", icon: UserPlus, external: true },
    { href: "/admin/support?status=open", label: "View open tickets", icon: LifeBuoy },
    { href: "/admin/support?assigned=me", label: "View assigned tickets", icon: ShieldCheck },
    { href: "/admin/users", label: "Search users", icon: Users }
  ];
  if (pathname === "/admin/maintenance") return [
    { command: "enable", label: "Enable maintenance", icon: Wrench },
    { command: "disable", label: "Disable maintenance", icon: Wrench },
    { command: "publish", label: "Publish changes", icon: Zap },
    { href: "/admin/maintenance/preview", label: "Preview maintenance page", icon: Eye },
  ];
  if (pathname.startsWith("/admin/maintenance")) return [
    { href: "/admin/maintenance", label: "Return to maintenance controls", icon: Wrench },
    { href: "/maintenance", label: "View public maintenance page", icon: ExternalLink, external: true },
  ];
  if (pathname.startsWith("/admin/users")) return [
    { href: "/admin/users", label: "Find a user", icon: Search },
    { href: "/admin/users", label: "Find account for reset", icon: ShieldCheck },
    { href: "/admin/support", label: "View support tickets", icon: LifeBuoy }
  ];
  if (pathname.startsWith("/admin/activity")) return [
    { href: "/admin/activity", label: "Recent activity", icon: Activity },
    { href: "/admin/users", label: "Search users", icon: Users },
    { href: "/admin/support", label: "Review support", icon: LifeBuoy }
  ];
  return [
    { href: "/admin/support?status=open", label: "Open tickets", icon: LifeBuoy },
    { href: "/admin/users", label: "Find a user", icon: Users },
    { href: "/admin/maintenance", label: "Manage maintenance", icon: Wrench },
    { href: "/admin/activity", label: "Recent activity", icon: Activity },
    { href: "/", label: "Go to public site", icon: ExternalLink, external: true }
  ];
}

export function AdminQuickActions() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const menuId = useId();
  const actions = actionsForPath(pathname);
  const closeMenu = () => setOpen(false);
  const runCommand = (command: NonNullable<QuickAction["command"]>) => {
    window.dispatchEvent(new CustomEvent("ltcl:maintenance-action", { detail: command }));
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    (firstLink.current ?? firstButton.current)?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => trigger.current?.focus());
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {open ? <div id={menuId} className="mb-2 w-72 rounded-xl border border-border bg-surface-elevated p-3 shadow-lab" aria-label="Admin quick actions">
        <div className="mb-2 flex items-center justify-between"><p className="font-black text-foreground">Quick actions</p><button className="btn-icon btn-ghost" aria-label="Close quick actions" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X className="h-4 w-4" /></button></div>
        <nav className="grid gap-1">
          {actions.map(({ href, command, label, icon: Icon, external }, index) => command
            ? <button key={command} ref={index === 0 ? firstButton : undefined} type="button" className="btn-ghost justify-start" onClick={() => runCommand(command)}><Icon className="h-4 w-4" />{label}</button>
            : <Link key={(href ?? "") + label} ref={index === 0 ? firstLink : undefined} className="btn-ghost justify-start" href={href!} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} onClick={closeMenu}><Icon className="h-4 w-4" />{label}{external ? <span className="sr-only"> (opens in a new tab)</span> : null}</Link>)}
        </nav>
      </div> : null}
      <button ref={trigger} type="button" className="btn-primary shadow-lab" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((value) => !value)}><Zap className="h-4 w-4" />Quick actions</button>
    </div>
  );
}
