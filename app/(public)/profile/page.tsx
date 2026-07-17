import { redirect } from "next/navigation";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { AccountAvatar } from "@/components/AccountAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { RoleBadge } from "@/components/RoleBadge";
import { LocalTime } from "@/components/LocalTime";
import { resolveAccountIdentity } from "@/lib/identity";
import { getCurrentUserRole } from "@/lib/maintenance-server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getCurrentUserRole();
  if (!session.user || !session.supabase) redirect("/login?next=/profile");

  const db = session.supabase as any;
  const [{ data: profile }, { data: preferences }] = await Promise.all([
    db.from("profiles").select("display_name,username,avatar_url,avatar_source,bio,preferred_language,experience_level,learning_goal,created_at,onboarding_completed").eq("id", session.user.id).maybeSingle(),
    db.from("learning_preferences").select("daily_minutes,learning_format").eq("user_id", session.user.id).maybeSingle()
  ]);
  const identity = resolveAccountIdentity(session.user, session.profile);

  return (
    <PageShell>
      <SectionHeader eyebrow="Profile" title="Your learner identity." copy="Profile data connects account settings, onboarding, learning goals, privacy preferences, and progress records." />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="glass rounded-lg p-6">
          <div className="flex flex-wrap items-center gap-5">
            <AccountAvatar identity={identity} size="lg" className="shadow-lab" />
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-3xl font-black text-foreground">{identity.label}</h2><RoleBadge role={session.role} /></div>
              <p className="mt-2 text-muted">{identity.email}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-black uppercase text-subtle">Username</p>
              <p className="mt-1 font-black text-foreground">{profile?.username ? `@${profile.username}` : "Not set"}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-black uppercase text-subtle">Provider</p>
              <p className="mt-1 font-black text-foreground">{identity.googleConnected ? "Google connected" : "Email"}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-black uppercase text-subtle">Joined</p>
              <p className="mt-1 font-black text-foreground">{profile?.created_at ? <LocalTime value={profile.created_at} /> : "Recently"}</p>
            </div>
          </div>
        </aside>
        <ProfileForm
          identity={identity}
          role={session.role ?? "learner"}
          profile={{
            display_name: profile?.display_name ?? null,
            username: profile?.username ?? null,
            avatar_url: profile?.avatar_url ?? null,
            avatar_source: profile?.avatar_source ?? "provider",
            bio: profile?.bio ?? null,
            preferred_language: session.profile?.preferred_language ?? null,
            experience_level: profile?.experience_level ?? null,
            learning_goal: profile?.learning_goal ?? null
          }}
          preferences={preferences}
        />
      </div>
    </PageShell>
  );
}
