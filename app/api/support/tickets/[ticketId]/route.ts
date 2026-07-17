import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation } from "@/lib/request-security";

export async function POST(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const { ticketId } = await params;
  const payload = (await request.json().catch(() => null)) as { action?: string } | null;
  if (payload?.action !== "close") return NextResponse.json({ message: "Choose a valid ticket action." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  const db = supabase as any;
  const { error } = await db.rpc("close_own_support_ticket", { target_ticket_id: ticketId });
  if (error) return NextResponse.json({ message: "Only your own resolved ticket can be closed." }, { status: 403 });
  return NextResponse.json({ message: "Ticket closed." }, { headers: { "Cache-Control": "no-store" } });
}
