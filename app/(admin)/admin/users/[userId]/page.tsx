import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AccountAvatar } from "@/components/AccountAvatar";
import { CopyButton } from "@/components/CopyButton";
import { LocalTime } from "@/components/LocalTime";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { UserStaffNoteForm } from "@/components/admin/UserStaffNoteForm";
import { SupportStatusBadge } from "@/components/support/SupportStatusBadge";
import { canManageAccount } from "@/lib/admin-security";
import { getAdminContext } from "@/lib/admin-server";
import { resolveAccountIdentity } from "@/lib/identity";

export const dynamic = "force-dynamic";

export default async function AdminUserDetail({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const admin = await getAdminContext();
  if (!admin.service) notFound();
  const db = admin.service as any;
  const [profileResult, authResult, attempts, progress, skills, tickets, history, userNotes, languages, recentAttempts] = await Promise.all([
    db.from("profiles").select("id,email,display_name,username,avatar_url,role,onboarding_completed,account_status,account_status_reason,account_status_changed_at,preferred_language,experience_level,learning_goal,created_at").eq("id", userId).maybeSingle(),
    admin.service.auth.admin.getUserById(userId),
    db.from("attempts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("lesson_progress").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed"),
    db.from("skill_scores").select("language_slug,topic,mastery").eq("user_id", userId).order("mastery", { ascending: false }).limit(8),
    db.from("support_tickets").select("id,ticket_number,subject,status,updated_at,archived_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(20),
    db.from("account_status_history").select("id,actor_id,previous_status,new_status,reason,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    db.from("user_staff_notes").select("id,author_id,body,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    db.from("language_experience").select("language_slug,experience_level").eq("user_id", userId).order("created_at", { ascending: false }),
    db.from("attempts").select("id,attempt_type,language_slug,score,started_at,completed_at").eq("user_id", userId).order("started_at", { ascending: false }).limit(5)
  ]);
  const profile = profileResult.data;
  const authUser = authResult.data.user;
  if (!profile || !authUser) notFound();
  const identity = resolveAccountIdentity(authUser, profile);
  const actorIds = [...new Set([...(userNotes.data ?? []).map((item: any) => item.author_id), ...(history.data ?? []).map((item: any) => item.actor_id)].filter(Boolean))];
  const { data: actors = [] } = actorIds.length ? await db.from("profiles").select("id,display_name,email").in("id", actorIds) : { data: [] };
  const actorMap = new Map(actors.map((actor: any) => [actor.id, actor]));
  const manageable = canManageAccount({ actorId: admin.user!.id, actorRole: admin.role, targetId: userId, targetRole: profile.role });
  const providers = identity.providers.length ? identity.providers.join(", ") : "email";

  return <>
    <AdminPageHeader title={identity.label} description="Complete account identity, support history, staff notes, and controlled recovery actions." actions={<><CopyButton value={userId} label="Copy user ID" /><Link className="btn-outline" href="/admin/users">Back to users</Link></>} />
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="grid gap-6">
        <AdminCard><div className="flex items-center gap-4"><AccountAvatar identity={identity} size="lg" decorative /><div className="min-w-0"><h2 className="type-section">{identity.label}</h2><p className="truncate text-muted">{identity.email}</p><code className="text-xs text-subtle">{userId}</code></div></div><dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><IdentityField label="Display name" value={profile.display_name || "Not set"} /><IdentityField label="Username" value={profile.username || "Not set"} /><IdentityField label="Email" value={profile.email || authUser.email || "Not set"} /><IdentityField label="Role" value={profile.role} /><IdentityField label="Account status" value={profile.account_status} /><IdentityField label="Authentication providers" value={providers} /><IdentityField label="Email confirmed" value={authUser.email_confirmed_at ? "Yes" : "No"} /><IdentityField label="Joined" value={<LocalTime value={profile.created_at} />} /><IdentityField label="Last sign-in" value={authUser.last_sign_in_at ? <LocalTime value={authUser.last_sign_in_at} /> : "Never"} /></dl></AdminCard>
        <AdminCard><h2 className="type-card">Learning activity</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Attempts" value={attempts.count ?? 0} /><Metric label="Lessons completed" value={progress.count ?? 0} /><Metric label="Skill topics" value={skills.data?.length ?? 0} /></div>{skills.data?.length ? <ul className="mt-4 grid gap-2">{skills.data.map((skill: any) => <li key={`${skill.language_slug}-${skill.topic}`} className="flex justify-between rounded-lg border border-border p-3"><span>{skill.language_slug} · {skill.topic}</span><strong>{Math.round(Number(skill.mastery))}%</strong></li>)}</ul> : <p className="mt-4 text-sm text-muted">No recorded skill scores yet.</p>}</AdminCard>
        <AdminCard><h2 className="type-card">Support ticket history</h2>{tickets.data?.length ? <ul className="mt-4 divide-y divide-border">{tickets.data.map((ticket: any) => <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-bold">#{ticket.ticket_number} {ticket.subject}</p><div className="mt-1 flex items-center gap-2"><SupportStatusBadge status={ticket.status} />{ticket.archived_at ? <span className="text-xs font-bold text-violet-700">Archived</span> : null}<LocalTime value={ticket.updated_at} className="text-xs text-muted" /></div></div><Link className="btn-outline" href={`/admin/support/${ticket.id}`}>Manage ticket</Link></li>)}</ul> : <p className="mt-4 text-sm text-muted">No support tickets.</p>}</AdminCard>
        <AdminCard><h2 className="type-card">Account history</h2>{history.data?.length ? <ul className="mt-4 divide-y divide-border">{history.data.map((event: any) => { const actor = actorMap.get(event.actor_id) as any; return <li key={event.id} className="py-3"><p className="font-bold capitalize">{event.previous_status} → {event.new_status}</p><p className="text-sm text-muted">{event.reason}</p><p className="mt-1 text-xs text-subtle">{actor?.display_name || actor?.email || "Former staff member"} · <LocalTime value={event.created_at} /></p></li>; })}</ul> : <p className="mt-4 text-sm text-muted">No account-status changes.</p>}</AdminCard>
      </div>
      <aside className="grid content-start gap-6">
        <AdminCard><h2 className="type-card">Learning profile</h2><dl className="mt-4 grid gap-3 text-sm"><IdentityField label="Onboarding" value={profile.onboarding_completed ? "Complete" : "Not complete"} /><IdentityField label="Preferred language" value={profile.preferred_language || "Not set"} /><IdentityField label="Experience" value={profile.experience_level || "Not set"} /><IdentityField label="Learning goal" value={profile.learning_goal || "Not set"} /></dl><p className="mt-4 text-sm text-muted">{languages.data?.length ? languages.data.map((item: any) => `${item.language_slug} (${item.experience_level})`).join(", ") : "No selected language experience."}</p>{recentAttempts.data?.length ? <ul className="mt-4 grid gap-2 text-sm">{recentAttempts.data.map((attempt: any) => <li key={attempt.id} className="rounded-lg bg-surface-secondary p-3"><strong>{attempt.attempt_type}</strong><span className="block text-muted">{attempt.language_slug || "General"} · {attempt.score ?? "No score"} · <LocalTime value={attempt.started_at} /></span></li>)}</ul> : <p className="mt-3 text-sm text-muted">No recent attempts.</p>}</AdminCard>
        <AdminCard><h2 className="type-card">Private staff notes</h2><p className="mt-1 text-sm text-muted">Append-only and never shown to the learner.</p>{userNotes.data?.length ? <ul className="mt-4 grid gap-3">{userNotes.data.map((note: any) => { const author = actorMap.get(note.author_id) as any; return <li key={note.id} className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><p className="whitespace-pre-wrap">{note.body}</p><p className="mt-2 text-xs">{author?.display_name || author?.email || "Former staff member"} · <LocalTime value={note.created_at} /></p></li>; })}</ul> : <p className="mt-3 text-sm text-muted">No private account notes.</p>}{manageable ? <UserStaffNoteForm userId={userId} /> : null}</AdminCard>
        <AdminCard><h2 className="type-card">Account actions</h2><p className="mt-2 mb-5 text-sm text-muted">These actions never reveal passwords, tokens, or reset links. Every attempt is audited.</p><AdminUserActions userId={userId} status={profile.account_status} manageable={manageable} emailConfirmed={Boolean(authUser.email_confirmed_at)} /></AdminCard>
      </aside>
    </div>
  </>;
}

function IdentityField({ label, value }: { label: string; value: ReactNode }) {
  return <div><dt className="type-caption">{label}</dt><dd className="mt-1 font-bold text-foreground">{value}</dd></div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-surface-secondary p-4"><p className="type-caption">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}
