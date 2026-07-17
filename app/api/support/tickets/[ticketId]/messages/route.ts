import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSupportMessage } from "@/lib/support";
import { isSameOriginMutation } from "@/lib/request-security";

export async function POST(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const { ticketId } = await params;
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !user) return NextResponse.json({ message: "Sign in to reply." }, { status: 401 });
  const payload = (await request.json().catch(() => null)) as { message?: unknown } | null;
  const valid = validateSupportMessage(payload?.message);
  if (!valid.ok) return NextResponse.json({ message: valid.message }, { status: 400 });
  const db = supabase as any;
  const { data: ticket } = await db.from("support_tickets").select("id,status").eq("id", ticketId).eq("user_id", user.id).maybeSingle();
  if (!ticket) return NextResponse.json({ message: "Ticket not found." }, { status: 404 });
  if (!["open", "in_progress", "waiting_on_user"].includes(ticket.status)) return NextResponse.json({ message: "Only active tickets can receive replies." }, { status: 409 });
  const { error } = await db.from("support_messages").insert({ ticket_id: ticketId, author_id: user.id, author_kind: "learner", body: valid.body });
  if (error) return NextResponse.json({ message: "Reply could not be saved." }, { status: 500 });
  return NextResponse.json({ message: "Reply sent." }, { headers: { "Cache-Control": "no-store" } });
}
