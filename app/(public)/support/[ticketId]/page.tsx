import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { SupportReplyForm } from "@/components/support/SupportForms";
import { CloseTicketButton } from "@/components/support/CloseTicketButton";
import { formatSupportCategory, formatSupportStatus } from "@/lib/support";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default async function LearnerTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params; const supabase = await createClient(); const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } }; if (!user || !supabase) redirect(`/login?next=${encodeURIComponent(`/support/${ticketId}`)}`); const db = supabase as any;
  const { data: ticket } = await db.from("support_tickets").select("id,ticket_number,subject,category,status,created_at,updated_at").eq("id", ticketId).eq("user_id", user.id).maybeSingle(); if (!ticket) notFound(); const { data: messages = [] } = await db.from("support_messages").select("id,author_kind,body,created_at").eq("ticket_id", ticketId).order("created_at");
  return <PageShell narrow><SectionHeader eyebrow={`Ticket #${ticket.ticket_number}`} title={ticket.subject} copy={`${formatSupportStatus(ticket.status)} · ${formatSupportCategory(ticket.category)}`} /><div className="mb-5 flex flex-wrap gap-2"><Link className="btn-outline" href="/support">Back to support</Link>{ticket.status === "resolved" ? <CloseTicketButton ticketId={ticketId} /> : null}</div><section className="surface-panel"><p className="mb-4 text-sm text-muted">Created {date.format(new Date(ticket.created_at))} · Updated {date.format(new Date(ticket.updated_at))}</p><div className="grid gap-3">{messages.map((message: any) => <article key={message.id} className={`rounded-lg border p-4 ${message.author_kind === "staff" ? "border-blue-300 bg-blue-50 text-slate-950" : "border-border bg-surface-secondary"}`}><div className="flex justify-between gap-3 text-xs"><strong>{message.author_kind === "staff" ? "LearnToCodeLab staff" : "You"}</strong><time>{date.format(new Date(message.created_at))}</time></div><p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p></article>)}</div>{["open", "in_progress", "waiting_on_user"].includes(ticket.status) ? <div className="mt-6 border-t border-border pt-5"><SupportReplyForm ticketId={ticketId} /></div> : <p className="mt-5 rounded-lg bg-surface-secondary p-4 text-sm font-bold">{ticket.status === "resolved" ? "This ticket is resolved. Close it when you are satisfied with the outcome." : "This ticket is closed. Create a new ticket if you need more help."}</p>}</section></PageShell>;
}
