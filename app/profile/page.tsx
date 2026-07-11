import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const userResult = supabase ? await supabase.auth.getUser() : null;
  const user = userResult?.data.user;

  if (supabase && !user) redirect("/auth/sign-in");

  return (
    <PageShell>
      <SectionHeader eyebrow="Profile" title="Your learner identity." copy="Profile data connects account settings, onboarding, learning goals, privacy preferences, and progress records." />
      <div className="glass rounded-[2rem] p-6">
        <div className="flex flex-wrap items-center gap-5">
          <img src="/learntocodelab-logo.png" alt="" className="h-24 w-24 rounded-3xl object-cover shadow-lab" />
          <div>
            <h2 className="text-3xl font-black text-lab-navy">{user?.email ?? "Guest learner"}</h2>
            <p className="mt-2 text-slate-600">{user ? "Connected to Supabase auth." : "Supabase env vars are not configured, so this is a local preview profile."}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {["Learning goals", "Language experience", "Privacy preferences"].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 font-black text-lab-navy">{item}</div>
          ))}
        </div>
        <Link href="/settings/privacy" className="mt-6 inline-flex rounded-xl bg-lab-navy px-4 py-3 font-black text-white">Manage privacy</Link>
      </div>
    </PageShell>
  );
}
