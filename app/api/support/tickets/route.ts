import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSupportTicket } from "@/lib/support";
import { isSameOriginMutation } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !user) return NextResponse.json({ message: "Sign in to contact support." }, { status: 401 });
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const valid = validateSupportTicket(payload ?? {});
  if (!valid.ok) return NextResponse.json({ message: valid.message }, { status: 400 });
  const db = supabase as any;
  const { data: ticketId, error } = await db.rpc("create_support_ticket", { ticket_subject: valid.value.subject, ticket_category: valid.value.category, initial_message: valid.value.message, related_page: valid.value.pageUrl, include_diagnostics: valid.value.diagnosticsConsent, diagnostic_payload: valid.value.diagnosticsConsent ? { userAgent: request.headers.get("user-agent")?.slice(0, 300) || null } : null });
  if (error) {
    const limited = error.code === "23505" || error.code === "P0001";
    return NextResponse.json({ message: limited ? "A similar ticket is already open, or tickets were created too quickly. Review your existing tickets before trying again." : "Your ticket could not be created." }, { status: limited ? 429 : 500 });
  }
  return NextResponse.json({ message: "Support ticket created.", ticketId }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
