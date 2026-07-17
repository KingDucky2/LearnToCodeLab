import Link from "next/link";
import { Inbox, LifeBuoy } from "lucide-react";
import { AccountAvatar } from "@/components/AccountAvatar";
import { LocalTime } from "@/components/LocalTime";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { SupportQueueFilters } from "@/components/admin/SupportQueueFilters";
import { SupportStatusBadge } from "@/components/support/SupportStatusBadge";
import { getAdminContext } from "@/lib/admin-server";
import { resolveAccountIdentity } from "@/lib/identity";
import { formatSupportCategory, formatSupportStatus, supportCategories, supportStatuses } from "@/lib/support";

export const dynamic = "force-dynamic";
const pageSize = 20;
const priorities = ["low", "normal", "high", "urgent"] as const;

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const admin = await getAdminContext();
  const db = admin.supabase as any;
  const status = typeof params.status === "string" && supportStatuses.includes(params.status as any) ? params.status : "all";
  const category = typeof params.category === "string" && supportCategories.includes(params.category as any) ? params.category : "all";
  const priority = typeof params.priority === "string" && priorities.includes(params.priority as any) ? params.priority : "all";
  const archive = params.archive === "archived" || params.archive === "all" ? params.archive : "active";
  const assignment = typeof params.assigned === "string" ? params.assigned : "all";
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 120).replace(/[,%()]/g, "") : "";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);
  const sort = params.sort === "oldest" ? "oldest" : "recent";
  const [matchingProfiles, staffResult, ...countResults] = await Promise.all([
    search ? db.from("profiles").select("id").or(`email.ilike.%${search}%,display_name.ilike.%${search}%,username.ilike.%${search}%`).limit(50) : Promise.resolve({ data: [] }),
    db.from("profiles").select("id,display_name,email").in("role", ["admin", "owner"]).order("display_name"),
    ...supportStatuses.map((item) => db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", item).is("archived_at", null)),
    db.from("support_tickets").select("id", { count: "exact", head: true }).not("archived_at", "is", null)
  ]);
  const staff = staffResult.data ?? [];
  const allowedStaffIds = new Set(staff.map((person: any) => person.id));
  const selectedAssignment = assignment === "me" || assignment === "unassigned" || allowedStaffIds.has(assignment) ? assignment : "all";
  const counts = new Map(supportStatuses.map((item, index) => [item, countResults[index]?.count ?? 0]));
  const archivedCount = countResults.at(-1)?.count ?? 0;
  const matchingUserIds = (matchingProfiles.data ?? []).map((profile: any) => profile.id) as string[];
  let query = db.from("support_tickets").select("id,ticket_number,user_id,subject,category,status,priority,needs_staff_attention,assigned_to,created_at,updated_at,archived_at", { count: "exact" });
  if (archive === "active") query = query.is("archived_at", null);
  if (archive === "archived") query = query.not("archived_at", "is", null);
  if (status !== "all") query = query.eq("status", status);
  if (category !== "all") query = query.eq("category", category);
  if (priority !== "all") query = query.eq("priority", priority);
  if (selectedAssignment === "me") query = query.eq("assigned_to", admin.user!.id);
  else if (selectedAssignment === "unassigned") query = query.is("assigned_to", null);
  else if (selectedAssignment !== "all") query = query.eq("assigned_to", selectedAssignment);
  if (search) {
    const filters = [`subject.ilike.%${search}%`];
    if (/^\d+$/.test(search)) filters.push(`ticket_number.eq.${search}`);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(search)) filters.push(`id.eq.${search}`);
    if (matchingUserIds.length) filters.push(`user_id.in.(${matchingUserIds.join(",")})`);
    query = query.or(filters.join(","));
  }
  const { data: tickets = [], count = 0 } = await query.order("updated_at", { ascending: sort === "oldest" }).range((page - 1) * pageSize, page * pageSize - 1);
  const profileIds = [...new Set(tickets.flatMap((ticket: any) => [ticket.user_id, ticket.assigned_to]).filter(Boolean))] as string[];
  const { data: profiles = [] } = profileIds.length ? await db.from("profiles").select("id,email,display_name,username,avatar_url").in("id", profileIds) : { data: [] };
  const people = new Map(profiles.map((profile: any) => [profile.id, profile]));
  const preserved = { ...(search ? { q: search } : {}), ...(status !== "all" ? { status } : {}), ...(category !== "all" ? { category } : {}), ...(priority !== "all" ? { priority } : {}), ...(selectedAssignment !== "all" ? { assigned: selectedAssignment } : {}), ...(archive !== "active" ? { archive } : {}), sort };
  const totalTickets = [...counts.values()].reduce((sum, value) => sum + value, 0) + archivedCount;
  const filterValues = { q: search, status, category, priority, assigned: selectedAssignment, archive, sort };
  const staffOptions = staff.map((person: any) => ({ id: person.id, label: person.display_name || person.email }));
  const priorityTone: Record<string, string> = { low: "bg-slate-100 text-slate-700", normal: "bg-blue-100 text-blue-800", high: "bg-amber-100 text-amber-900", urgent: "bg-red-100 text-red-800" };

  return <>
    <AdminPageHeader title="Support" description="Search, prioritize, assign, and manage every learner request from one queue." />
    <div className={`mb-5 flex flex-wrap gap-2 ${totalTickets === 0 ? "opacity-70" : ""}`} aria-label="Ticket counts by status">{supportStatuses.map((item) => { const countForStatus = counts.get(item) ?? 0; return <Link key={item} href={`/admin/support?status=${item}`} className={`flex min-w-32 items-center justify-between gap-4 rounded-lg border px-3 py-2 transition hover:border-primary ${countForStatus > 0 ? "border-border bg-surface shadow-sm" : "border-transparent bg-surface-secondary/50 text-muted"}`}><span className="text-xs font-bold">{formatSupportStatus(item)}</span><strong className={countForStatus > 0 ? "text-base text-foreground" : "text-sm"}>{countForStatus}</strong></Link>; })}<Link href="/admin/support?archive=archived" className={`flex min-w-32 items-center justify-between gap-4 rounded-lg border px-3 py-2 transition hover:border-primary ${archivedCount > 0 ? "border-border bg-surface shadow-sm" : "border-transparent bg-surface-secondary/50 text-muted"}`}><span className="text-xs font-bold">Archived</span><strong className={archivedCount > 0 ? "text-base text-foreground" : "text-sm"}>{archivedCount}</strong></Link></div>
    <AdminCard className="p-4"><SupportQueueFilters values={filterValues} staff={staffOptions} adminId={admin.user?.id ?? "unknown"} /></AdminCard>
    <section className="mt-5 overflow-hidden rounded-xl border border-border bg-surface" aria-label="Support tickets">
      {tickets.length ? <><div className="hidden grid-cols-[minmax(260px,1.7fr)_minmax(180px,1fr)_150px_150px_130px_auto] gap-3 border-b border-border bg-surface-secondary px-4 py-2 text-xs font-bold uppercase tracking-wide text-subtle lg:grid"><span>Ticket</span><span>Learner</span><span>Status</span><span>Assigned</span><span>Updated</span><span className="sr-only">Action</span></div><div className="divide-y divide-border">{tickets.map((ticket: any) => { const user = people.get(ticket.user_id) as any; const assignee = people.get(ticket.assigned_to) as any; const identity = resolveAccountIdentity({ email: user?.email, identities: [] }, user); return <article key={ticket.id} className="grid gap-3 px-4 py-3 transition-colors hover:bg-surface-secondary/35 lg:grid-cols-[minmax(260px,1.7fr)_minmax(180px,1fr)_150px_150px_130px_auto] lg:items-center">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-black text-foreground">#{ticket.ticket_number} {ticket.subject}</p>{ticket.archived_at ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-800">Archived</span> : null}</div><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted"><span>{formatSupportCategory(ticket.category)}</span><span aria-hidden="true">·</span><span className={`rounded-full px-2 py-0.5 font-bold capitalize ${priorityTone[ticket.priority] ?? priorityTone.normal}`}>{ticket.priority}</span>{ticket.needs_staff_attention ? <><span aria-hidden="true">·</span><span className="font-black text-amber-800">Needs staff</span></> : null}</div></div>
        <div className="flex min-w-0 items-center gap-2"><AccountAvatar identity={identity} size="sm" decorative /><div className="min-w-0"><p className="truncate text-sm font-bold">{identity.label}</p><Link className="text-xs font-bold text-primary hover:underline" href={`/admin/users/${ticket.user_id}`}>View profile</Link></div></div>
        <div><span className="mb-1 block text-xs font-bold text-subtle lg:hidden">Status</span><SupportStatusBadge status={ticket.status} /></div>
        <div className="text-sm"><span className="mb-1 block text-xs font-bold text-subtle lg:hidden">Assigned</span>{assignee?.display_name || assignee?.email || <span className="text-muted">Unassigned</span>}</div>
        <div className="text-sm"><span className="mb-1 block text-xs font-bold text-subtle lg:hidden">Updated</span><LocalTime value={ticket.updated_at} /></div>
        <Link className="btn-outline justify-center lg:px-3" href={`/admin/support/${ticket.id}`}>Manage</Link>
      </article>; })}</div></> : <div className="px-6 py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-secondary text-primary">{totalTickets === 0 ? <Inbox className="h-6 w-6" /> : <LifeBuoy className="h-6 w-6" />}</div><p className="mt-4 font-black text-foreground">{totalTickets === 0 ? "No support tickets yet" : "No tickets match these filters"}</p><p className="mx-auto mt-1 max-w-md text-sm text-muted">{totalTickets === 0 ? "Learner requests will automatically appear here when someone asks for help." : "Try clearing a filter or broadening your search."}</p>{totalTickets > 0 ? <Link href="/admin/support" className="btn-outline mt-4">Clear filters</Link> : null}</div>}
    </section>
    <nav className="mt-4 flex items-center justify-between" aria-label="Support pagination"><Link className={`btn-outline ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={`/admin/support?${new URLSearchParams({ ...preserved, page: String(page - 1) })}`}>Previous</Link><p className="text-sm text-muted">Page {page} · {count ?? 0} matching tickets</p><Link className={`btn-outline ${page * pageSize >= (count ?? 0) ? "pointer-events-none opacity-50" : ""}`} href={`/admin/support?${new URLSearchParams({ ...preserved, page: String(page + 1) })}`}>Next</Link></nav>
  </>;
}
