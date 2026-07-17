import Link from "next/link";
import { LifeBuoy, Plus } from "lucide-react";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { LocalTime } from "@/components/LocalTime";
import { SupportStatusBadge } from "@/components/support/SupportStatusBadge";
import { formatSupportCategory } from "@/lib/support";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams; const supabase = await createClient(); const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user || !supabase) return <PageShell narrow><SectionHeader eyebrow="Support" title="How can we help?" copy="Sign in to create a private support ticket and follow replies from the LearnToCodeLab team." /><div className="surface-panel"><h2 className="type-card">Account support</h2><p className="mt-2 text-muted">For password trouble, use the secure reset flow. Staff will never ask for or view your password.</p><div className="mt-5 flex flex-wrap gap-2"><Link className="btn-primary" href="/login?next=/support">Sign in</Link><Link className="btn-outline" href="/forgot-password">Reset password</Link></div></div></PageShell>;
  const db = supabase as any; const { data: tickets = [] } = await db.from("support_tickets").select("id,ticket_number,subject,category,status,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(50);
  return <PageShell><SectionHeader eyebrow="Support" title="Your support tickets" copy="Messages are private between you and authorized LearnToCodeLab staff." />{notice === "account-restricted" ? <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-950">Your account is currently restricted from protected learning areas. You can still use support and password recovery.</div> : null}<div className="mb-5 flex justify-end"><Link className="btn-primary" href="/support/new"><Plus className="h-4 w-4" />New ticket</Link></div>{tickets.length ? <div className="grid gap-3">{tickets.map((ticket: any) => <Link key={ticket.id} href={`/support/${ticket.id}`} className="surface-interactive p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="type-caption">Ticket #{ticket.ticket_number} · {formatSupportCategory(ticket.category)}</p><h2 className="mt-1 font-black text-foreground">{ticket.subject}</h2></div><SupportStatusBadge status={ticket.status} /></div><p className="mt-3 text-sm text-muted">Updated <LocalTime value={ticket.updated_at} /></p></Link>)}</div> : <div className="surface-panel py-12 text-center"><LifeBuoy className="mx-auto h-9 w-9 text-subtle" /><h2 className="mt-3 type-card">No support tickets</h2><p className="mt-2 text-muted">When you need help, create a ticket and the conversation will appear here.</p></div>}</PageShell>;
}
