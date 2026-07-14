"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const publicNavItems = [
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Practice" }
];

const privateNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" }
];

type NavUser = { label: string; avatar: string | null; isAdmin: boolean } | null;

export function AppNavClient({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [...publicNavItems, ...(user ? privateNavItems : []), ...(user?.isAdmin ? [{ href: "/admin", label: "Admin" }] : [])];

  useEffect(() => setMenuOpen(false), [pathname]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-3 z-40 mx-auto mt-3 w-[min(1180px,calc(100%_-_24px))] rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2 shadow-lab backdrop-blur">
      <div className="flex min-h-12 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg font-black text-lab-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/30">
          <Image src="/learntocodelab-logo.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-lg object-cover shadow-md" priority />
          <span className="truncate"><span className="hidden sm:inline">LearnToCode Lab</span><span className="sm:hidden">LTCL</span></span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`rounded-lg px-3 py-2 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/30 ${isActive(item.href) ? "bg-[#06172f] text-white" : "text-slate-600 hover:bg-slate-100 hover:text-lab-navy"}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link href="/profile" className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-extrabold text-lab-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/30">
                <AccountAvatar user={user} />
                <span className="max-w-28 truncate xl:max-w-36">{user.label}</span>
              </Link>
              <SignOutButton compact />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-extrabold text-lab-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/30">Sign In</Link>
              <Link href="/signup" className="rounded-lg bg-gradient-to-r from-lab-teal to-lab-blue px-3 py-2 text-sm font-black text-[#06172f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/30">Create Account</Link>
            </>
          )}
        </div>

        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} title={menuOpen ? "Close menu" : "Open menu"} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 text-lab-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/30 lg:hidden">
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {menuOpen ? (
        <div id="mobile-navigation" className="mt-2 border-t border-slate-200 pt-3 lg:hidden">
          <nav className="grid gap-2 sm:grid-cols-2" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`rounded-lg border px-4 py-3 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/30 ${isActive(item.href) ? "border-[#06172f] bg-[#06172f] text-white" : "border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 border-t border-slate-200 pt-3">
            {user ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Link href="/profile" className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-3 font-extrabold text-lab-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/30">
                  <AccountAvatar user={user} />
                  <span className="min-w-0 truncate">{user.label}</span>
                </Link>
                <SignOutButton />
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Link href="/login" className="rounded-lg border border-slate-200 px-4 py-3 text-center font-extrabold text-lab-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/30">Sign In</Link>
                <Link href="/signup" className="rounded-lg bg-gradient-to-r from-lab-teal to-lab-blue px-4 py-3 text-center font-black text-[#06172f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/30">Create Account</Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function AccountAvatar({ user }: { user: Exclude<NavUser, null> }) {
  return user.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatar} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
  ) : (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-lab-blue/10 text-xs text-lab-navy"><UserRound className="h-4 w-4" aria-hidden="true" /></span>
  );
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/auth/sign-out" method="post">
      <button type="submit" title="Sign out" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#06172f] py-2 text-sm font-black text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lab-blue/30 ${compact ? "w-11 px-0" : "w-full px-4"}`}>
        <LogOut className="h-4 w-4" aria-hidden="true" /><span className={compact ? "sr-only" : ""}>Sign Out</span>
      </button>
    </form>
  );
}
