import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, ExternalLink, Eye, ListChecks, ShieldCheck, Wrench } from "lucide-react";
import { AdminCard, AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminShell";
import { defaultMaintenanceSettings } from "@/lib/maintenance";
import { requireAdmin } from "@/lib/maintenance-server";

export const dynamic = "force-dynamic";
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin.supabase) return null;
  const db = admin.supabase as any;
  const [{ data: settings }, { data: tasks }, { data: updates }] = await Promise.all([
    db.from("site_settings").select("maintenance_enabled,progress_percent,updated_at").eq("id", "global").maybeSingle(),
    db.from("maintenance_tasks").select("id,status,visible").order("display_order"),
    db.from("maintenance_updates").select("id,title,message,published_at,visible").eq("visible", true).order("published_at", { ascending: false }).limit(3)
  ]);
  const config = { ...defaultMaintenanceSettings, ...(settings ?? {}) };
  const allTasks = tasks ?? [];
  const completed = allTasks.filter((task: { status: string }) => task.status === "completed").length;

  return (
    <>
      <AdminPageHeader title="Platform overview" description="A focused view of site availability and the maintenance work your visitors can see." actions={<><Link href="/admin/maintenance" className="btn-primary"><Wrench className="h-4 w-4" />Manage maintenance</Link><Link href="/admin/maintenance/preview" className="btn-outline"><Eye className="h-4 w-4" />Preview</Link></>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform status">
        <AdminCard><p className="type-caption">Public site</p><div className="mt-3"><AdminStatusBadge active={config.maintenance_enabled} /></div></AdminCard>
        <AdminCard><p className="type-caption">Authentication</p><p className="mt-3 flex items-center gap-2 font-black text-success"><ShieldCheck className="h-5 w-5" />Admin verified</p></AdminCard>
        <AdminCard><p className="type-caption">Overall progress</p><p className="mt-2 text-3xl font-black text-foreground">{config.progress_percent}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-secondary" role="progressbar" aria-valuenow={config.progress_percent} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-primary" style={{ width: `${config.progress_percent}%` }} /></div></AdminCard>
        <AdminCard><p className="type-caption">Maintenance tasks</p><p className="mt-2 text-3xl font-black text-foreground">{completed}<span className="text-base text-subtle"> / {allTasks.length}</span></p><p className="mt-1 text-sm text-muted">completed</p></AdminCard>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <AdminCard>
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="type-caption">Current operation</p><h2 className="mt-1 type-section">Maintenance control</h2></div><AdminStatusBadge active={config.maintenance_enabled} /></div>
          <dl className="mt-6 grid gap-4 border-y border-border py-5 sm:grid-cols-3"><div><dt className="type-caption">Last updated</dt><dd className="mt-1 font-bold text-foreground">{config.updated_at ? dateFormatter.format(new Date(config.updated_at)) : "Not yet recorded"}</dd></div><div><dt className="type-caption">Tasks</dt><dd className="mt-1 font-bold text-foreground">{allTasks.length} total</dd></div><div><dt className="type-caption">Visible tasks</dt><dd className="mt-1 font-bold text-foreground">{allTasks.filter((task: { visible: boolean }) => task.visible).length}</dd></div></dl>
          <div className="mt-5 flex flex-wrap gap-2"><Link href="/admin/maintenance" className="btn-primary">Open controls <ArrowRight className="h-4 w-4" /></Link><Link href="/maintenance" target="_blank" className="btn-outline">View public page <ExternalLink className="h-4 w-4" /></Link></div>
        </AdminCard>
        <AdminCard>
          <h2 className="type-card">Recent updates</h2>
          {updates?.length ? <div className="mt-4 grid gap-4">{updates.map((update: { id: string; title: string; message: string; published_at: string }) => <article key={update.id} className="border-l-2 border-primary pl-3"><h3 className="font-black text-foreground">{update.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted">{update.message}</p><time className="mt-1 block text-xs text-subtle" dateTime={update.published_at}>{dateFormatter.format(new Date(update.published_at))}</time></article>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-border p-5 text-center"><Clock3 className="mx-auto h-6 w-6 text-subtle" /><p className="mt-2 font-bold text-foreground">No published updates</p><p className="mt-1 text-sm text-muted">Add one when there is news worth sharing.</p></div>}
        </AdminCard>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Quick actions">
        <Link href="/admin/maintenance#tasks" className="surface-interactive p-5"><ListChecks className="h-5 w-5 text-primary" /><h2 className="mt-3 font-black text-foreground">Manage work items</h2><p className="mt-1 text-sm text-muted">Update task status, order, and visibility.</p></Link>
        <Link href="/admin/maintenance#updates" className="surface-interactive p-5"><CheckCircle2 className="h-5 w-5 text-primary" /><h2 className="mt-3 font-black text-foreground">Publish an update</h2><p className="mt-1 text-sm text-muted">Keep visitors informed during longer work.</p></Link>
      </section>
    </>
  );
}
