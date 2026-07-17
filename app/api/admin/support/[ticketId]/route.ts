import { NextResponse } from "next/server";
import { getAdminContext, writeAdminAudit } from "@/lib/admin-server";
import { isSupportStatus, validateSupportMessage } from "@/lib/support";
import { isSameOriginMutation } from "@/lib/request-security";

type Payload = { action?: "reply" | "note" | "status" | "assign-self" | "unassign" | "archive" | "restore" | "delete-permanent"; message?: unknown; status?: unknown };

export async function POST(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const { ticketId } = await params;
  const admin = await getAdminContext();
  if (!admin.user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (!admin.authorized || !admin.supabase) return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  const payload = (await request.json().catch(() => null)) as Payload | null;
  if (!payload?.action) return NextResponse.json({ message: "Choose a support action." }, { status: 400 });
  const db = admin.supabase as any;
  const { data: ticket } = await db.from("support_tickets").select("id,status,user_id,archived_at").eq("id", ticketId).maybeSingle();
  if (!ticket) return NextResponse.json({ message: "Ticket not found." }, { status: 404 });
  let error: { message?: string } | null = null;
  let summary = "Support ticket updated.";
  if (payload.action === "delete-permanent") {
    if (admin.role !== "owner") return NextResponse.json({ message: "Only an owner can permanently delete a ticket." }, { status: 403 });
    if (!ticket.archived_at) return NextResponse.json({ message: "Archive the ticket before permanently deleting it." }, { status: 409 });
    if (!admin.service) return NextResponse.json({ message: "Ticket deletion is unavailable." }, { status: 503 });
    const result = await (admin.service as any).from("support_tickets").delete().eq("id", ticketId);
    error = result.error;
    summary = "Ticket and its related conversation were permanently deleted.";
  } else if (payload.action === "archive" || payload.action === "restore") {
    const result = await db.rpc("admin_set_support_ticket_archived", { target_ticket_id: ticketId, should_archive: payload.action === "archive" });
    error = result.error;
    summary = payload.action === "archive" ? "Ticket archived." : "Ticket restored.";
  } else if (payload.action === "assign-self" || payload.action === "unassign") {
    const result = await db.from("support_tickets").update({ assigned_to: payload.action === "assign-self" ? admin.user.id : null }).eq("id", ticketId);
    error = result.error;
    summary = payload.action === "assign-self" ? "Ticket assigned to current staff member." : "Ticket assignment cleared.";
  } else if (payload.action === "status") {
    if (!isSupportStatus(payload.status)) return NextResponse.json({ message: "Choose a valid ticket status." }, { status: 400 });
    const result = await db.rpc("admin_set_support_ticket_status", { target_ticket_id: ticketId, next_status: payload.status });
    error = result.error;
    summary = `Ticket status changed to ${payload.status}.`;
  } else {
    const valid = validateSupportMessage(payload.message);
    if (!valid.ok) return NextResponse.json({ message: valid.message }, { status: 400 });
    const table = payload.action === "note" ? "support_staff_notes" : "support_messages";
    const record = payload.action === "note"
      ? { ticket_id: ticketId, author_id: admin.user.id, body: valid.body }
      : { ticket_id: ticketId, author_id: admin.user.id, author_kind: "staff", body: valid.body };
    const result = await db.from(table).insert(record);
    error = result.error;
    summary = payload.action === "note" ? "Private staff note added." : "Staff reply sent.";
  }
  if (admin.service) await writeAdminAudit({ service: admin.service, actorId: admin.user.id, actorRole: admin.role || "unknown", action: `support.${payload.action}`, targetType: "ticket", targetId: ticketId, summary: error ? "Support action failed safely." : summary, result: error ? "failed" : "success" });
  if (error) return NextResponse.json({ message: "The support action could not be completed." }, { status: 500 });
  return NextResponse.json({ message: summary, deleted: payload.action === "delete-permanent" }, { headers: { "Cache-Control": "no-store" } });
}
