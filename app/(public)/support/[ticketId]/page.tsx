import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LocalTime } from "@/components/LocalTime";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { CloseTicketButton } from "@/components/support/CloseTicketButton";
import { SupportReplyForm } from "@/components/support/SupportForms";
import { SupportMessageCard } from "@/components/support/SupportMessageCard";
import { SupportStatusBadge } from "@/components/support/SupportStatusBadge";
import { resolveAccountIdentity, type AccountIdentity } from "@/lib/identity";
import { formatSupportCategory, formatSupportStatus } from "@/lib/support";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const staffIdentity: AccountIdentity = { label: "LearnToCodeLab Staff", email: "", avatarUrl: null, avatarUrls: [], initials: "LS", googleConnected: false, providers: [] };

export default async function LearnerTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user || !supabase) redirect(`/login?next=${encodeURIComponent(`/support/${ticketId}`)}`);
  const db = supabase as any;
  const { data: ticket } = await db.from("support_tickets").select("id,ticket_number,subject,category,status,created_at,updated_at").eq("id", ticketId).eq("user_id", user.id).maybeSingle();
  if (!ticket) notFound();
  const [{ data: messages = [] }, { data: profile }, { data: statusHistory = [] }] = await Promise.all([
    db.from("support_messages").select("id,author_id,author_kind,body,created_at").eq("ticket_id", ticketId).order("created_at"),
    db.from("profiles").select("email,display_name,avatar_url").eq("id", user.id).maybeSingle(),
    db.from("support_ticket_status_history").select("id,previous_status,new_status,created_at").eq("ticket_id", ticketId).order("created_at")
  ]);
  const learnerIdentity = resolveAccountIdentity(user, profile);
  const timeline = [...messages.map((item: any) => ({ ...item, kind: "message" as const })), ...statusHistory.map((item: any) => ({ ...item, kind: "status" as const }))].sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());

  return <PageShell narrow><SectionHeader eyebrow={`Ticket #${ticket.ticket_number}`} title={ticket.subject} copy={formatSupportCategory(ticket.category)} /><div className="mb-5 flex flex-wrap items-center gap-2"><SupportStatusBadge status={ticket.status} /><Link className="btn-outline ml-auto" href="/support">Back to support</Link>{ticket.status === "resolved" ? <CloseTicketButton ticketId={ticketId} /> : null}</div><section className="surface-panel"><p className="mb-5 text-sm text-muted">Created <LocalTime value={ticket.created_at} /> · Updated <LocalTime value={ticket.updated_at} /></p><div className="grid gap-4">{timeline.map((item: any) => item.kind === "message" ? <SupportMessageCard key={`message-${item.id}`} body={item.body} createdAt={item.created_at} identity={item.author_kind === "staff" ? staffIdentity : learnerIdentity} staff={item.author_kind === "staff"} /> : <div key={`status-${item.id}`} className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-secondary px-3 py-2 text-xs text-muted"><span>Status changed from {formatSupportStatus(item.previous_status)} to</span><SupportStatusBadge status={item.new_status} /><LocalTime value={item.created_at} /></div>)}</div>{["open", "in_progress", "waiting_on_user"].includes(ticket.status) ? <div className="mt-6 border-t border-border pt-5"><SupportReplyForm ticketId={ticketId} /></div> : <p className="mt-5 rounded-lg bg-surface-secondary p-4 text-sm font-bold">{ticket.status === "resolved" ? "This ticket is resolved. Close it when you are satisfied with the outcome." : "This ticket is closed. Create a new ticket if you need more help."}</p>}</section></PageShell>;
}
