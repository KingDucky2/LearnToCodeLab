import Link from "next/link";
import { notFound } from "next/navigation";
import { LocalTime } from "@/components/LocalTime";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { SupportReplyForm, SupportStatusForm } from "@/components/support/SupportForms";
import { SupportMessageCard } from "@/components/support/SupportMessageCard";
import { SupportStatusBadge } from "@/components/support/SupportStatusBadge";
import { getAdminContext } from "@/lib/admin-server";
import { resolveAccountIdentity, type AccountIdentity } from "@/lib/identity";
import { formatSupportCategory, formatSupportStatus } from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function AdminTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const admin = await getAdminContext();
  const db = admin.supabase as any;
  const { data: ticket } = await db.from("support_tickets").select("id,ticket_number,user_id,subject,category,status,priority,page_url,diagnostics_consent,diagnostics,assigned_to,created_at,updated_at,resolved_at,closed_at,archived_at").eq("id", ticketId).maybeSingle();
  if (!ticket) notFound();
  const [{ data: messages = [] }, { data: notes = [] }, { data: user }, { data: statusHistory = [] }] = await Promise.all([
    db.from("support_messages").select("id,author_id,author_kind,body,created_at").eq("ticket_id", ticketId).order("created_at"),
    db.from("support_staff_notes").select("id,author_id,body,created_at").eq("ticket_id", ticketId).order("created_at"),
    db.from("profiles").select("id,email,display_name,username,avatar_url,account_status").eq("id", ticket.user_id).maybeSingle(),
    db.from("support_ticket_status_history").select("id,previous_status,new_status,changed_by,created_at").eq("ticket_id", ticketId).order("created_at")
  ]);
  const authorIds = [...new Set([...messages, ...notes, ...statusHistory].map((item: any) => item.author_id || item.changed_by).concat(ticket.assigned_to).filter(Boolean))];
  const { data: authors = [] } = authorIds.length ? await db.from("profiles").select("id,display_name,email,avatar_url").in("id", authorIds) : { data: [] };
  const authorMap = new Map(authors.map((author: any) => [author.id, author]));
  const assignee = authorMap.get(ticket.assigned_to) as any;
  const learnerIdentity = resolveAccountIdentity({ email: user?.email }, user);
  const identityFor = (authorId: string | null, staff: boolean): AccountIdentity => {
    if (!staff) return learnerIdentity;
    const author = authorMap.get(authorId) as any;
    return { ...resolveAccountIdentity({ email: author?.email }, author), label: "LearnToCodeLab Staff", initials: "LS" };
  };
  const timeline = [
    ...messages.map((item: any) => ({ ...item, kind: "message" as const })),
    ...statusHistory.map((item: any) => ({ ...item, kind: "status" as const }))
  ].sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());

  return <>
    <AdminPageHeader title={`Ticket #${ticket.ticket_number}`} description={ticket.subject} actions={<><Link className="btn-outline" href={`/admin/users/${ticket.user_id}`}>View user profile</Link><Link className="btn-outline" href="/admin/support">Back to queue</Link></>} />
    <div className="mb-5 flex flex-wrap items-center gap-2"><SupportStatusBadge status={ticket.status} />{ticket.archived_at ? <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-800">Archived</span> : null}</div>
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="grid gap-6">
        <AdminCard><h2 className="type-card">Conversation</h2><div className="mt-4 grid gap-4">{timeline.map((item: any) => item.kind === "message" ? <SupportMessageCard key={`message-${item.id}`} body={item.body} createdAt={item.created_at} identity={identityFor(item.author_id, item.author_kind === "staff")} staff={item.author_kind === "staff"} /> : <div key={`status-${item.id}`} className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-secondary px-3 py-2 text-xs text-muted"><span>Status changed from {formatSupportStatus(item.previous_status)} to</span><SupportStatusBadge status={item.new_status} /><LocalTime value={item.created_at} /></div>)}</div>{!timeline.length ? <p className="mt-4 text-sm text-muted">No conversation activity yet.</p> : null}<div className="mt-6 border-t border-border pt-5"><SupportReplyForm ticketId={ticketId} admin /></div></AdminCard>
        <AdminCard><h2 className="type-card">Private staff notes</h2><p className="mt-1 text-sm text-muted">Never visible to the learner. Notes are append-only.</p><div className="mt-4 grid gap-3">{notes.map((note: any) => { const author = authorMap.get(note.author_id) as any; return <article key={note.id} className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950"><div className="flex flex-wrap justify-between gap-2 text-xs"><strong>{author?.display_name || author?.email || "Former staff member"}</strong><LocalTime value={note.created_at} /></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{note.body}</p></article>; })}{!notes.length ? <p className="text-sm text-muted">No private notes.</p> : null}</div><div className="mt-5"><SupportReplyForm ticketId={ticketId} admin note /></div></AdminCard>
      </div>
      <aside className="grid content-start gap-6">
        <AdminCard><h2 className="type-card">Ticket controls</h2><div className="mt-2"><SupportStatusBadge status={ticket.status} /></div><p className="mt-2 text-sm text-muted">Assigned to {assignee?.display_name || assignee?.email || "no one"}</p><div className="mt-4"><SupportStatusForm ticketId={ticketId} status={ticket.status} assigned={Boolean(ticket.assigned_to)} archived={Boolean(ticket.archived_at)} owner={admin.role === "owner"} /></div></AdminCard>
        <AdminCard><h2 className="type-card">Context</h2><dl className="mt-4 grid gap-3 text-sm"><div><dt className="type-caption">Learner</dt><dd className="font-bold">{user?.display_name || user?.username || user?.email || "Unknown user"}</dd></div><div><dt className="type-caption">Category</dt><dd className="font-bold">{formatSupportCategory(ticket.category)}</dd></div><div><dt className="type-caption">Priority</dt><dd className="font-bold capitalize">{ticket.priority}</dd></div><div><dt className="type-caption">Created</dt><dd className="font-bold"><LocalTime value={ticket.created_at} /></dd></div><div><dt className="type-caption">Updated</dt><dd className="font-bold"><LocalTime value={ticket.updated_at} /></dd></div><div><dt className="type-caption">Page</dt><dd className="break-all font-bold">{ticket.page_url || "Not supplied"}</dd></div><div><dt className="type-caption">Diagnostics consent</dt><dd className="font-bold">{ticket.diagnostics_consent ? "Yes" : "No"}</dd></div></dl></AdminCard>
      </aside>
    </div>
  </>;
}
