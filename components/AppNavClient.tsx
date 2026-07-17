"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { AccountAvatar } from "@/components/AccountAvatar";
import type { AccountIdentity } from "@/lib/identity";
import { RoleBadge } from "@/components/RoleBadge";

const publicNavItems = [
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Practice" }
];

const privateNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" }
];

type NavUser = { identity: AccountIdentity; isAdmin: boolean; role: string } | null;

export function AppNavClient({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const navItems = [...publicNavItems, ...(user ? privateNavItems.slice(0, 1) : [])];

  useEffect(() => {
    setMenuOpen(false);
    if (accountMenuRef.current) accountMenuRef.current.open = false;
  }, [pathname]);
  useEffect(() => {
    const closeAccountMenu = (event: PointerEvent) => {
      const menu = accountMenuRef.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !accountMenuRef.current?.open) return;
      accountMenuRef.current.open = false;
      accountMenuRef.current.querySelector<HTMLElement>("summary")?.focus();
    };
    document.addEventListener("pointerdown", closeAccountMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeAccountMenu); document.removeEventListener("keydown", closeOnEscape); };
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="layer-nav sticky top-2 mx-auto mt-2 w-[min(1180px,calc(100%_-_16px))] rounded-lg border border-border bg-surface/95 px-3 shadow-surface backdrop-blur sm:top-3 sm:mt-3 sm:w-[min(1180px,calc(100%_-_24px))]">
      <div className="flex h-16 items-center justify-between gap-3">
        <Link href="/" aria-label="LearnToCode Lab home" className="flex min-w-0 items-center gap-3 rounded-lg font-black text-foreground focus-visible:outline-none">
          <BrandLogo />
          <span className="truncate text-sm sm:text-base">LearnToCode Lab</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`btn-ghost min-h-10 px-3 ${isActive(item.href) ? "bg-surface-secondary text-foreground ring-1 ring-border-strong" : ""}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? <AccountMenu user={user} detailsRef={accountMenuRef} /> : (
            <>
              <Link href="/login" className="btn-outline">Sign In</Link>
              <Link href="/signup" className="btn-primary">Create Account</Link>
            </>
          )}
        </div>

        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} title={menuOpen ? "Close menu" : "Open menu"} className="btn-icon btn-outline lg:hidden">
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {menuOpen ? (
        <div id="mobile-navigation" className="border-t border-border py-3 lg:hidden">
          <nav className="grid gap-2 sm:grid-cols-2" aria-label="Mobile navigation">
            {[...publicNavItems, ...(user ? privateNavItems : []), ...(user?.isAdmin ? [{ href: "/admin", label: "Administration" }] : [])].map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`btn-outline justify-start ${isActive(item.href) ? "border-primary bg-surface-secondary text-foreground" : ""}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 border-t border-border pt-3">
            {user ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Link href="/profile" aria-label={`Open profile for ${user.identity.label}`} className="btn-outline min-w-0 justify-start">
                  <AccountAvatar identity={user.identity} decorative />
                  <span className="min-w-0 truncate">{user.identity.label}</span>
                  <RoleBadge role={user.role} />
                </Link>
                <SignOutButton />
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Link href="/login" className="btn-outline">Sign In</Link>
                <Link href="/signup" className="btn-primary">Create Account</Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function AccountMenu({ user, detailsRef }: { user: Exclude<NavUser, null>; detailsRef: RefObject<HTMLDetailsElement | null> }) {
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profile", label: "Profile", icon: UserRound },
    { href: "/settings", label: "Settings", icon: Settings },
    ...(user.isAdmin ? [{ href: "/admin", label: "Administration", icon: ShieldCheck }] : [])
  ];

  return (
    <details ref={detailsRef} className="group relative">
      <summary className="btn-outline flex max-w-56 cursor-pointer list-none pr-3 [&::-webkit-details-marker]:hidden">
        <AccountAvatar identity={user.identity} decorative />
        <span className="min-w-0 truncate" title={user.identity.label}>{user.identity.label}</span><RoleBadge role={user.role} />
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="layer-dropdown absolute right-0 top-[calc(100%+8px)] w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface-elevated p-2 shadow-lab">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs font-bold text-muted"><span className="overflow-wrap-anywhere">Signed in as {user.identity.label}</span><RoleBadge role={user.role} /></div>
        <nav className="grid gap-1" aria-label="Account navigation">
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="btn-ghost justify-start"><Icon className="h-4 w-4" aria-hidden="true" />{label}</Link>
          ))}
        </nav>
        <div className="mt-2 border-t border-border pt-2"><SignOutButton /></div>
      </div>
    </details>
  );
}

function SignOutButton() {
  return (
    <form action="/auth/sign-out" method="post" className="w-full">
      <button type="submit" className="btn-ghost w-full justify-start"><LogOut className="h-4 w-4" aria-hidden="true" />Sign Out</button>
    </form>
  );
}
