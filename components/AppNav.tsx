import Link from "next/link";

const navItems = [
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Practice" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" }
];

export function AppNav() {
  return (
    <header className="sticky top-3 z-40 mx-auto mt-3 flex w-[min(1180px,calc(100%_-_24px))] flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/88 px-3 py-2 shadow-lab backdrop-blur">
      <Link href="/" className="flex items-center gap-3 font-black text-lab-navy">
        <img src="/learntocodelab-logo.png" alt="" className="h-11 w-11 rounded-xl object-cover shadow-md" />
        <span>LearnToCode Lab</span>
      </Link>
      <nav className="flex flex-wrap items-center gap-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-100 hover:text-lab-navy">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex gap-2">
        <Link href="/auth/sign-in" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-extrabold text-lab-navy">
          Sign in
        </Link>
        <Link href="/auth/create-account" className="rounded-xl bg-gradient-to-r from-lab-teal to-lab-blue px-3 py-2 text-sm font-black text-lab-navy">
          Start free
        </Link>
      </div>
    </header>
  );
}
