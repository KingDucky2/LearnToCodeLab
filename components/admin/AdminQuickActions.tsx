"use client";

import Link from "next/link";
import { ExternalLink, LifeBuoy, Search, Users, Wrench, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function AdminQuickActions() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
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
      {open ? <div className="mb-2 w-72 rounded-xl border border-border bg-surface-elevated p-3 shadow-lab" aria-label="Admin quick actions">
        <div className="mb-2 flex items-center justify-between"><p className="font-black text-foreground">Quick actions</p><button className="btn-icon btn-ghost" aria-label="Close quick actions" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X className="h-4 w-4" /></button></div>
        <nav className="grid gap-1">
          <Link ref={firstLink} className="btn-ghost justify-start" href="/admin/users"><Users className="h-4 w-4" />Find a user</Link>
          <Link className="btn-ghost justify-start" href="/admin/support?status=open"><LifeBuoy className="h-4 w-4" />Open tickets</Link>
          <Link className="btn-ghost justify-start" href="/admin/activity"><Search className="h-4 w-4" />Review activity</Link>
          <Link className="btn-ghost justify-start" href="/admin/maintenance#updates"><Wrench className="h-4 w-4" />Maintenance updates</Link>
          <Link className="btn-ghost justify-start" href="/" target="_blank"><ExternalLink className="h-4 w-4" />Go to public site</Link>
        </nav>
      </div> : null}
      <button ref={trigger} type="button" className="btn-primary shadow-lab" aria-expanded={open} onClick={() => setOpen((value) => !value)}><Zap className="h-4 w-4" />Quick actions</button>
    </div>
  );
}
