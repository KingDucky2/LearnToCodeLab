import Link from "next/link";
import { LifeBuoy, Search } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin-server";
import { formatSupportCategory, formatSupportStatus, supportCategories, supportStatuses } from "@/lib/support";

export const dynamic = "force-dynamic";
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const pageSize = 20;

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams; const admin = await getAdminContext(); const db = admin.supabase as any;
  const status = typeof params.status === "string" && supportStatuses.includes(params.status as any) ? params.status : "all";
  const category = typeof params.category === "string" ? params.category.slice(0, 40) : "all";
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 120).replace(/[,%()]/g, "") : "";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);
  const sort = params.sort === "oldest" ? "oldest" : "recent";
  const matchingProfiles = search ? await db.from("profiles").select("id").or(`email.ilike.%${search}%,display_name.ilike.%${search}%`).limit(50) : { data: [] };
  const matchingUserIds = (matchingProfiles.data ?? []).map((profile: any) => profile.id) as string[];
  let query = db.from("support_tickets").select("id,ticket_number,user_id,subject,category,status,priority,needs_staff_attention,assigned_to,created_at,updated_at", { count: "exact" });
  if (status !== "all") query = query.eq("status", status);
  if (category !== "all") query = query.eq("category", category);
  if (search) {
    const filters = [`subject.ilike.%${search}%`];
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(search)) filters.push(`id.eq.${search}`);
    if (matchingUserIds.length) filters.push(`user_id.in.(${matchingUserIds.join(",")})`);
    query = query.or(filters.join(","));
  }
  const { data: tickets = [], count = 0 } = await query.order("updated_at", { ascending: sort === "oldest" }).range((page - 1) * pageSize, page * pageSize - 1);
  const userIds = [...new Set(tickets.map((ticket: any) => ticket.user_id))] as string[];
  const { data: profiles = [] } = userIds.length ? await db.from("profiles").select("id,email,display_name").in("id", userIds) : { data: [] };
  const users = new Map(profiles.map((profile: any) => [profile.id, profile]));
  return <><AdminPageHeader title="Support" description="Review real learner requests, reply publicly, and keep staff notes private." />
    <AdminCard><form action="/admin/support" className="grid gap-3 md:grid-cols-[1fr_160px_160px_150px_auto]"><label className="form-label">Search<input className="form-control" name="q" defaultValue={search} placeholder="Subject, ticket ID, user email, or name" /></label><label className="form-label">Status<select className="form-control" name="status" defaultValue={status}><option value="all">All statuses</option>{supportStatuses.map((item) => <option key={item} value={item}>{formatSupportStatus(item)}</option>)}</select></label><label className="form-label">Category<select className="form-control" name="category" defaultValue={category}><option value="all">All categories</option>{supportCategories.map((item) => <option key={item} value={item}>{formatSupportCategory(item)}</option>)}</select></label><label className="form-label">Sort<select className="form-control" name="sort" defaultValue={sort}><option value="recent">Recently updated</option><option value="oldest">Oldest updated</option></select></label><button className="btn-primary self-end"><Search className="h-4 w-4" />Filter</button></form></AdminCard>
    <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-surface-secondary text-xs uppercase text-subtle"><tr><th className="p-4">Ticket</th><th className="p-4">User</th><th className="p-4">Category</th><th className="p-4">Status</th><th className="p-4">Attention</th><th className="p-4">Updated</th><th className="p-4"></th></tr></thead><tbody className="divide-y divide-border">{tickets.map((ticket: any) => { const user = users.get(ticket.user_id) as any; return <tr key={ticket.id}><td className="p-4"><p className="font-black">#{ticket.ticket_number} {ticket.subject}</p><code className="text-[10px] text-subtle">{ticket.id}</code></td><td className="p-4"><p>{user?.display_name || user?.email || "Unknown user"}</p><Link className="text-xs font-bold text-primary" href={`/admin/users/${ticket.user_id}`}>View account</Link></td><td className="p-4">{formatSupportCategory(ticket.category)}</td><td className="p-4 font-bold">{formatSupportStatus(ticket.status)}</td><td className="p-4">{ticket.needs_staff_attention ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-950">Needs staff</span> : <span className="text-muted">Up to date</span>}</td><td className="p-4">{date.format(new Date(ticket.updated_at))}</td><td className="p-4"><Link className="btn-outline" href={`/admin/support/${ticket.id}`}>Open</Link></td></tr>; })}</tbody></table>{!tickets.length ? <div className="p-10 text-center"><LifeBuoy className="mx-auto h-8 w-8 text-subtle" /><p className="mt-2 font-black">No tickets match these filters.</p></div> : null}</div>
    <nav className="mt-4 flex items-center justify-between" aria-label="Support pagination"><Link className={`btn-outline ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={`/admin/support?${new URLSearchParams({ ...(search ? { q: search } : {}), ...(status !== "all" ? { status } : {}), ...(category !== "all" ? { category } : {}), sort, page: String(page - 1) })}`}>Previous</Link><p className="text-sm text-muted">Page {page} · {count ?? 0} matching tickets</p><Link className={`btn-outline ${page * pageSize >= (count ?? 0) ? "pointer-events-none opacity-50" : ""}`} href={`/admin/support?${new URLSearchParams({ ...(search ? { q: search } : {}), ...(status !== "all" ? { status } : {}), ...(category !== "all" ? { category } : {}), sort, page: String(page + 1) })}`}>Next</Link></nav>
  </>;
}
