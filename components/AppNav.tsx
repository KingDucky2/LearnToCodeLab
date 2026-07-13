import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/maintenance";

const publicNavItems = [
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Practice" }
];

const privateNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" }
];

export async function AppNav() {
  const supabase = await createClient();
  const {
    data: { user }
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const db = supabase as any;
  const { data: profile } = user && supabase ? await db.from("profiles").select("display_name, avatar_url, role").eq("id", user.id).maybeSingle() : { data: null };
  const avatar = profile?.avatar_url;
  const label = profile?.display_name || user?.email || "Account";

  return (
    <header className="sticky top-3 z-40 mx-auto mt-3 flex w-[min(1180px,calc(100%_-_24px))] flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/88 px-3 py-2 shadow-lab backdrop-blur">
      <Link href="/" className="flex items-center gap-3 font-black text-lab-navy">
        <Image src="/learntocodelab-logo.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl object-cover shadow-md" />
        <span>LearnToCode Lab</span>
      </Link>
      <nav className="flex flex-wrap items-center gap-1" aria-label="Main navigation">
        {publicNavItems.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-100 hover:text-lab-navy">
            {item.label}
          </Link>
        ))}
        {user
          ? [...privateNavItems, ...(isAdminRole(profile?.role) ? [{ href: "/admin", label: "Admin" }] : [])].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-100 hover:text-lab-navy">
                {item.label}
              </Link>
            ))
          : null}
      </nav>
      {user ? (
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/profile" className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 text-sm font-extrabold text-lab-navy">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-lab-blue/10 text-xs">{label.slice(0, 1).toUpperCase()}</span>
            )}
            <span className="max-w-32 truncate">{label}</span>
          </Link>
          <form action="/auth/sign-out" method="post">
            <button className="rounded-xl bg-lab-navy px-3 py-2 text-sm font-black text-white">Sign Out</button>
          </form>
        </div>
      ) : (
        <div className="flex gap-2">
          <Link href="/login" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-extrabold text-lab-navy">
            Sign In
          </Link>
          <Link href="/signup" className="rounded-xl bg-gradient-to-r from-lab-teal to-lab-blue px-3 py-2 text-sm font-black text-lab-navy">
            Create Account
          </Link>
        </div>
      )}
    </header>
  );
}
