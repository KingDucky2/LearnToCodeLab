import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { AccountAvatar } from "@/components/AccountAvatar";
import { CopyButton } from "@/components/CopyButton";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { normalizeAdminSearch } from "@/lib/admin-security";
import { getAdminContext } from "@/lib/admin-server";
import { resolveAccountIdentity } from "@/lib/identity";

export const dynamic = "force-dynamic";
const pageSize = 20;
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const admin = await getAdminContext();
  const service = admin.service;
  const search = normalizeAdminSearch(typeof params.q === "string" ? params.q : "");
  const filter = typeof params.filter === "string" ? params.filter : "all";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);
  if (!service) return <><AdminPageHeader title="Users" description="Search accounts and perform tightly controlled recovery actions." /><AdminCard><p className="font-bold text-foreground">User administration needs the server-only Supabase service-role key.</p><p className="mt-2 text-sm text-muted">Configure it in the deployment environment; never expose it to the browser.</p></AdminCard></>;
  const db = service as any;
  let query = db.from("profiles").select("id,email,display_name,avatar_url,role,onboarding_completed,account_status,auth_providers,created_at", { count: "exact" });
  if (search) {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(search);
    query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%${uuid ? `,id.eq.${search}` : ""}`);
  }
  if (filter === "email") query = query.contains("auth_providers", ["email"]);
  if (filter === "google") query = query.contains("auth_providers", ["google"]);
  if (filter === "suspended") query = query.eq("account_status", "suspended");
  if (filter === "recent") query = query.gte("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString());
  const { data: profiles = [], count = 0, error } = await query.order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  if (error) console.error("Admin user list query failed", { code: error.code });
  const ids = profiles.map((profile: any) => profile.id);
  const [authResults, ticketResult] = await Promise.all([
    Promise.all(ids.map((id: string) => service.auth.admin.getUserById(id))),
    ids.length ? db.from("support_tickets").select("user_id").in("user_id", ids).neq("status", "closed") : Promise.resolve({ data: [] })
  ]);
  const tickets = new Map<string, number>();
  for (const ticket of ticketResult.data ?? []) tickets.set(ticket.user_id, (tickets.get(ticket.user_id) ?? 0) + 1);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const href = (nextPage: number) => `/admin/users?${new URLSearchParams({ ...(search ? { q: search } : {}), ...(filter !== "all" ? { filter } : {}), page: String(nextPage) })}`;
  return <>
    <AdminPageHeader title="Users" description="Search account identity, onboarding, access status, and open support workload." />
    <AdminCard><form className="grid gap-3 md:grid-cols-[1fr_200px_auto]" action="/admin/users"><label className="form-label">Search<input className="form-control" name="q" defaultValue={search} placeholder="Email, display name, or exact user ID" /></label><label className="form-label">Filter<select className="form-control" name="filter" defaultValue={filter}><option value="all">All users</option><option value="email">Email provider</option><option value="google">Google provider</option><option value="suspended">Suspended</option><option value="recent">Joined recently</option></select></label><button className="btn-primary self-end"><Search className="h-4 w-4" />Search</button></form></AdminCard>
    <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="bg-surface-secondary text-xs uppercase text-subtle"><tr><th className="p-4">Account</th><th className="p-4">Providers</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Onboarding</th><th className="p-4">Joined</th><th className="p-4">Last sign-in</th><th className="p-4">Open tickets</th><th className="p-4"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-border">{profiles.map((profile: any, index: number) => { const authUser = authResults[index]?.data.user; const identity = resolveAccountIdentity(authUser ?? { email: profile.email, identities: [] }, profile); return <tr key={profile.id}><td className="p-4"><div className="flex items-center gap-3"><AccountAvatar identity={identity} size="sm" decorative /><div><p className="font-black text-foreground">{identity.label}</p><p className="text-xs text-muted">{profile.email}</p><span className="flex items-center"><code className="text-[10px] text-subtle">{profile.id}</code><CopyButton value={profile.id} label="Copy user ID" /></span></div></div></td><td className="p-4">{identity.providers.join(", ") || profile.auth_providers?.join(", ") || "email"}</td><td className="p-4 font-bold">{profile.role}</td><td className="p-4"><span className={profile.account_status === "suspended" ? "text-danger font-black" : "text-success font-black"}>{profile.account_status}</span></td><td className="p-4">{profile.onboarding_completed ? "Complete" : "Not complete"}</td><td className="p-4">{date.format(new Date(profile.created_at))}</td><td className="p-4">{authUser?.last_sign_in_at ? date.format(new Date(authUser.last_sign_in_at)) : "Never"}</td><td className="p-4">{tickets.get(profile.id) ?? 0}</td><td className="p-4"><Link className="btn-outline" href={`/admin/users/${profile.id}`}>View</Link></td></tr>; })}</tbody></table>{!profiles.length ? <div className="p-10 text-center"><UserRound className="mx-auto h-8 w-8 text-subtle" /><p className="mt-2 font-black">No users match these filters.</p></div> : null}</div>
    <nav className="mt-5 flex items-center justify-between" aria-label="User pagination"><Link className={`btn-outline ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={href(page - 1)}>Previous</Link><p className="text-sm text-muted">Page {page} of {totalPages} · {count ?? 0} users</p><Link className={`btn-outline ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`} href={href(page + 1)}>Next</Link></nav>
  </>;
}
