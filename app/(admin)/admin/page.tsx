import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, ExternalLink, Eye, LifeBuoy, ListChecks, ShieldCheck, Users, Wrench } from "lucide-react";
import { AdminCard, AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminShell";
import { LocalTime } from "@/components/LocalTime";
import { SupportStatusBadge } from "@/components/support/SupportStatusBadge";
import { defaultMaintenanceSettings } from "@/lib/maintenance";
import { requireAdmin } from "@/lib/maintenance-server";
import { supportStatuses } from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin.supabase) return null;
  const db = admin.supabase as any;
  const [{ data: settings }, { data: tasks }, { data: updates }, users, openTickets, suspendedUsers, { data: recentActivity }, ...ticketCountResults] = await Promise.all([
    db.from("site_settings").select("maintenance_enabled,progress_percent,updated_at").eq("id", "global").maybeSingle(),
    db.from("maintenance_tasks").select("id,status,visible").order("display_order"),
    db.from("maintenance_updates").select("id,title,message,published_at,visible").eq("visible", true).order("published_at", { ascending: false }).limit(3),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress", "waiting_on_user"]),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "suspended"),
    db.from("admin_audit_log").select("id,action,summary,result,created_at").order("created_at", { ascending: false }).limit(3),
    ...supportStatuses.map((status) => db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", status).is("archived_at", null))
  ]);
  const config = { ...defaultMaintenanceSettings, ...(settings ?? {}) };
  const allTasks = tasks ?? [];
  const completed = allTasks.filter((task: { status: string }) => task.status === "completed").length;
  const ticketCounts = new Map(supportStatuses.map((status, index) => [status, ticketCountResults[index]?.count ?? 0]));

  return (
    <>
      <AdminPageHeader title="Platform overview" description="A focused view of site availability and the maintenance work your visitors can see." actions={<><Link href="/admin/maintenance" className="btn-primary"><Wrench className="h-4 w-4" />Manage maintenance</Link><Link href="/admin/maintenance/preview" className="btn-outline"><Eye className="h-4 w-4" />Preview</Link></>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform status">
        <AdminCard><p className="type-caption">Public site</p><div className="mt-3"><AdminStatusBadge active={config.maintenance_enabled} /></div></AdminCard>
        <AdminCard><p className="type-caption">Authentication</p><p className="mt-3 flex items-center gap-2 font-black text-success"><ShieldCheck className="h-5 w-5" />Admin verified</p></AdminCard>
        <AdminCard><p className="type-caption">Overall progress</p><p className="mt-2 text-3xl font-black text-foreground">{config.progress_percent}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-secondary" role="progressbar" aria-valuenow={config.progress_percent} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-primary" style={{ width: `${config.progress_percent}%` }} /></div></AdminCard>
        <AdminCard><p className="type-caption">Maintenance tasks</p><p className="mt-2 text-3xl font-black text-foreground">{completed}<span className="text-base text-subtle"> / {allTasks.length}</span></p><p className="mt-1 text-sm text-muted">completed</p></AdminCard>
      </section>
      <section className="mt-4 grid gap-4 sm:grid-cols-3" aria-label="Account and support status">
        <AdminCard><p className="type-caption">Registered users</p><p className="mt-2 text-3xl font-black">{users.count ?? 0}</p><Link className="mt-3 inline-flex items-center gap-1 text-sm font-black text-primary" href="/admin/users">View users <ArrowRight className="h-4 w-4" /></Link></AdminCard>
        <AdminCard><p className="type-caption">Open support tickets</p><p className="mt-2 text-3xl font-black">{openTickets.count ?? 0}</p><Link className="mt-3 inline-flex items-center gap-1 text-sm font-black text-primary" href="/admin/support?status=open">Open queue <ArrowRight className="h-4 w-4" /></Link></AdminCard>
        <AdminCard><p className="type-caption">Suspended accounts</p><p className="mt-2 text-3xl font-black">{suspendedUsers.count ?? 0}</p><Link className="mt-3 inline-flex items-center gap-1 text-sm font-black text-primary" href="/admin/users?filter=suspended">Review accounts <ArrowRight className="h-4 w-4" /></Link></AdminCard>
      </section>
      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Tickets by status">{supportStatuses.map((status) => <Link key={status} href={`/admin/support?status=${status}`} className="rounded-xl border border-border bg-surface p-4 transition hover:border-primary"><SupportStatusBadge status={status} /><p className="mt-3 text-2xl font-black">{ticketCounts.get(status)}</p></Link>)}</section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <AdminCard>
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="type-caption">Current operation</p><h2 className="mt-1 type-section">Maintenance control</h2></div><AdminStatusBadge active={config.maintenance_enabled} /></div>
          <dl className="mt-6 grid gap-4 border-y border-border py-5 sm:grid-cols-3"><div><dt className="type-caption">Last updated</dt><dd className="mt-1 font-bold text-foreground">{config.updated_at ? <LocalTime value={config.updated_at} /> : "Not yet recorded"}</dd></div><div><dt className="type-caption">Tasks</dt><dd className="mt-1 font-bold text-foreground">{allTasks.length} total</dd></div><div><dt className="type-caption">Visible tasks</dt><dd className="mt-1 font-bold text-foreground">{allTasks.filter((task: { visible: boolean }) => task.visible).length}</dd></div></dl>
          <div className="mt-5 flex flex-wrap gap-2"><Link href="/admin/maintenance" className="btn-primary">Open controls <ArrowRight className="h-4 w-4" /></Link><Link href="/maintenance" target="_blank" className="btn-outline">View public page <ExternalLink className="h-4 w-4" /></Link></div>
        </AdminCard>
        <AdminCard>
          <h2 className="type-card">Recent updates</h2>
          {updates?.length ? <div className="mt-4 grid gap-4">{updates.map((update: { id: string; title: string; message: string; published_at: string }) => <article key={update.id} className="border-l-2 border-primary pl-3"><h3 className="font-black text-foreground">{update.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted">{update.message}</p><LocalTime value={update.published_at} className="mt-1 block text-xs text-subtle" /></article>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-border p-5 text-center"><Clock3 className="mx-auto h-6 w-6 text-subtle" /><p className="mt-2 font-bold text-foreground">No published updates</p><p className="mt-1 text-sm text-muted">Add one when there is news worth sharing.</p></div>}
        </AdminCard>
        <AdminCard><div className="flex items-center justify-between gap-3"><h2 className="type-card">Recent admin activity</h2><Link className="text-sm font-black text-primary" href="/admin/activity">View all</Link></div>{recentActivity?.length ? <div className="mt-4 grid gap-3">{recentActivity.map((event: { id: string; action: string; summary: string; result: string; created_at: string }) => <article key={event.id} className="rounded-lg border border-border p-3"><div className="flex justify-between gap-2"><h3 className="font-black text-foreground">{event.action}</h3><span className="text-xs font-bold uppercase text-subtle">{event.result}</span></div><p className="mt-1 text-sm text-muted">{event.summary}</p><LocalTime value={event.created_at} className="mt-1 block text-xs text-subtle" /></article>)}</div> : <p className="mt-4 text-sm text-muted">No sensitive admin actions have been recorded yet.</p>}</AdminCard>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5" aria-label="Quick actions">
        <Link href="/admin/users" className="surface-interactive p-5"><Users className="h-5 w-5 text-primary" /><h2 className="mt-3 font-black text-foreground">Find a user</h2><p className="mt-1 text-sm text-muted">Review identity, access, and support history.</p></Link>
        <Link href="/admin/users?intent=reset" className="surface-interactive p-5"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="mt-3 font-black text-foreground">Send reset assistance</h2><p className="mt-1 text-sm text-muted">Find an account and send the secure recovery email.</p></Link>
        <Link href="/admin/support?status=open" className="surface-interactive p-5"><LifeBuoy className="h-5 w-5 text-primary" /><h2 className="mt-3 font-black text-foreground">Review support</h2><p className="mt-1 text-sm text-muted">Respond to pending learner requests.</p></Link>
        <Link href="/admin/maintenance#tasks" className="surface-interactive p-5"><ListChecks className="h-5 w-5 text-primary" /><h2 className="mt-3 font-black text-foreground">Manage work items</h2><p className="mt-1 text-sm text-muted">Update task status, order, and visibility.</p></Link>
        <Link href="/admin/maintenance#updates" className="surface-interactive p-5"><CheckCircle2 className="h-5 w-5 text-primary" /><h2 className="mt-3 font-black text-foreground">Publish an update</h2><p className="mt-1 text-sm text-muted">Keep visitors informed during longer work.</p></Link>
      </section>
    </>
  );
}
