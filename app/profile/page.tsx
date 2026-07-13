import { redirect } from "next/navigation";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { createClient } from "@/lib/supabase/server";

function providerLabel(provider: string | undefined) {
  if (!provider) return "Email";
  return provider === "google" ? "Google" : provider;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) redirect("/login?next=/profile");

  const db = supabase as any;
  const { data: profile } = await db
    .from("profiles")
    .select("display_name, username, avatar_url, bio, preferred_language, experience_level, learning_goal, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || "";
  const provider = user.app_metadata?.provider;

  return (
    <PageShell>
      <SectionHeader eyebrow="Profile" title="Your learner identity." copy="Profile data connects account settings, onboarding, learning goals, privacy preferences, and progress records." />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="glass rounded-[2rem] p-6">
          <div className="flex flex-wrap items-center gap-5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-24 w-24 rounded-3xl object-cover shadow-lab" />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-3xl bg-lab-blue/10 text-4xl font-black text-lab-blue">{displayName.slice(0, 1).toUpperCase()}</div>
            )}
            <div>
              <h2 className="text-3xl font-black text-lab-navy">{displayName}</h2>
              <p className="mt-2 text-slate-600">{user.email}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase text-slate-500">Username</p>
              <p className="mt-1 font-black text-lab-navy">{profile?.username ? `@${profile.username}` : "Not set"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase text-slate-500">Provider</p>
              <p className="mt-1 font-black text-lab-navy">{providerLabel(provider)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase text-slate-500">Joined</p>
              <p className="mt-1 font-black text-lab-navy">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Recently"}</p>
            </div>
          </div>
        </aside>
        <ProfileForm
          profile={{
            display_name: displayName,
            username: profile?.username ?? null,
            avatar_url: avatarUrl,
            bio: profile?.bio ?? null,
            preferred_language: profile?.preferred_language ?? null,
            experience_level: profile?.experience_level ?? null,
            learning_goal: profile?.learning_goal ?? null
          }}
        />
      </div>
    </PageShell>
  );
}
