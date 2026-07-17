import Link from "next/link";
import { LifeBuoy, Search } from "lucide-react";
import { LocalTime } from "@/components/LocalTime";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { SupportStatusBadge } from "@/components/support/SupportStatusBadge";
import { getAdminContext } from "@/lib/admin-server";
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
  const { data: profiles = [] } = profileIds.length ? await db.from("profiles").select("id,email,display_name,username").in("id", profileIds) : { data: [] };
  const people = new Map(profiles.map((profile: any) => [profile.id, profile]));
  const preserved = { ...(search ? { q: search } : {}), ...(status !== "all" ? { status } : {}), ...(category !== "all" ? { category } : {}), ...(priority !== "all" ? { priority } : {}), ...(selectedAssignment !== "all" ? { assigned: selectedAssignment } : {}), ...(archive !== "active" ? { archive } : {}), sort };

  return <>
    <AdminPageHeader title="Support" description="Search, prioritize, assign, and manage every learner request from one queue." />
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{supportStatuses.map((item) => <Link key={item} href={`/admin/support?status=${item}`} className="rounded-xl border border-border bg-surface p-4 transition hover:border-primary"><p className="type-caption">{formatSupportStatus(item)}</p><p className="mt-1 text-2xl font-black">{counts.get(item)}</p></Link>)}<Link href="/admin/support?archive=archived" className="rounded-xl border border-border bg-surface p-4 transition hover:border-primary"><p className="type-caption">Archived</p><p className="mt-1 text-2xl font-black">{archivedCount}</p></Link></div>
    <AdminCard><form action="/admin/support" className="grid gap-3 lg:grid-cols-4 xl:grid-cols-7"><label className="form-label lg:col-span-2">Search<input className="form-control" name="q" defaultValue={search} placeholder="Subject, ticket number, email, name" /></label><label className="form-label">Status<select className="form-control" name="status" defaultValue={status}><option value="all">All statuses</option>{supportStatuses.map((item) => <option key={item} value={item}>{formatSupportStatus(item)}</option>)}</select></label><label className="form-label">Category<select className="form-control" name="category" defaultValue={category}><option value="all">All categories</option>{supportCategories.map((item) => <option key={item} value={item}>{formatSupportCategory(item)}</option>)}</select></label><label className="form-label">Priority<select className="form-control" name="priority" defaultValue={priority}><option value="all">All priorities</option>{priorities.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></label><label className="form-label">Assigned staff<select className="form-control" name="assigned" defaultValue={selectedAssignment}><option value="all">Anyone</option><option value="me">Assigned to me</option><option value="unassigned">Unassigned</option>{staff.map((person: any) => <option key={person.id} value={person.id}>{person.display_name || person.email}</option>)}</select></label><label className="form-label">Archive<select className="form-control" name="archive" defaultValue={archive}><option value="active">Active only</option><option value="archived">Archived only</option><option value="all">All tickets</option></select></label><label className="form-label">Sort<select className="form-control" name="sort" defaultValue={sort}><option value="recent">Newest activity</option><option value="oldest">Oldest activity</option></select></label><button className="btn-primary self-end"><Search className="h-4 w-4" />Apply filters</button></form></AdminCard>
    <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-surface-secondary text-xs uppercase text-subtle"><tr><th className="p-4">Ticket</th><th className="p-4">User</th><th className="p-4">Category / priority</th><th className="p-4">Status</th><th className="p-4">Assigned</th><th className="p-4">Updated</th><th className="p-4"></th></tr></thead><tbody className="divide-y divide-border">{tickets.map((ticket: any) => { const user = people.get(ticket.user_id) as any; const assignee = people.get(ticket.assigned_to) as any; return <tr key={ticket.id}><td className="p-4"><p className="font-black">#{ticket.ticket_number} {ticket.subject}</p>{ticket.archived_at ? <p className="mt-1 text-xs font-bold text-violet-700">Archived</p> : null}</td><td className="p-4"><p>{user?.display_name || user?.username || user?.email || "Unknown user"}</p><Link className="text-xs font-bold text-primary" href={`/admin/users/${ticket.user_id}`}>View user profile</Link></td><td className="p-4"><p>{formatSupportCategory(ticket.category)}</p><p className="text-xs capitalize text-muted">{ticket.priority}</p></td><td className="p-4"><SupportStatusBadge status={ticket.status} />{ticket.needs_staff_attention ? <p className="mt-2 text-xs font-black text-amber-800">Needs staff</p> : null}</td><td className="p-4">{assignee?.display_name || assignee?.email || <span className="text-muted">Unassigned</span>}</td><td className="p-4"><LocalTime value={ticket.updated_at} /></td><td className="p-4"><Link className="btn-outline" href={`/admin/support/${ticket.id}`}>Manage</Link></td></tr>; })}</tbody></table>{!tickets.length ? <div className="p-10 text-center"><LifeBuoy className="mx-auto h-8 w-8 text-subtle" /><p className="mt-2 font-black">No tickets match these filters.</p><p className="mt-1 text-sm text-muted">Try clearing one or more filters.</p></div> : null}</div>
    <nav className="mt-4 flex items-center justify-between" aria-label="Support pagination"><Link className={`btn-outline ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={`/admin/support?${new URLSearchParams({ ...preserved, page: String(page - 1) })}`}>Previous</Link><p className="text-sm text-muted">Page {page} · {count ?? 0} matching tickets</p><Link className={`btn-outline ${page * pageSize >= (count ?? 0) ? "pointer-events-none opacity-50" : ""}`} href={`/admin/support?${new URLSearchParams({ ...preserved, page: String(page + 1) })}`}>Next</Link></nav>
  </>;
}
