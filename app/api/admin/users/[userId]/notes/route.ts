import { NextResponse } from "next/server";
import { canManageAccount } from "@/lib/admin-security";
import { getAdminContext, writeAdminAudit } from "@/lib/admin-server";
import { validateSupportMessage } from "@/lib/support";
import { isSameOriginMutation } from "@/lib/request-security";

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const { userId } = await params; const admin = await getAdminContext();
  if (!admin.user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (!admin.authorized || !admin.supabase) return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  const payload = (await request.json().catch(() => null)) as { note?: unknown } | null; const valid = validateSupportMessage(payload?.note);
  if (!valid.ok) return NextResponse.json({ message: valid.message }, { status: 400 });
  const db = admin.supabase as any; const { data: target } = await db.from("profiles").select("id,role").eq("id", userId).maybeSingle();
  if (!target || !canManageAccount({ actorId: admin.user.id, actorRole: admin.role, targetId: userId, targetRole: target.role })) {
    if (admin.service) await writeAdminAudit({ service: admin.service, actorId: admin.user.id, actorRole: admin.role || "unknown", action: "account.staff-note", targetType: "user", targetId: userId, summary: "Private account note denied by role safeguards.", result: "denied" });
    return NextResponse.json({ message: "Your role cannot add a note to this account." }, { status: 403 });
  }
  const { error } = await db.from("user_staff_notes").insert({ user_id: userId, author_id: admin.user.id, body: valid.body });
  if (admin.service) await writeAdminAudit({ service: admin.service, actorId: admin.user.id, actorRole: admin.role || "unknown", action: "account.staff-note", targetType: "user", targetId: userId, summary: error ? "Private account note failed safely." : "Private account note added.", result: error ? "failed" : "success" });
  if (error) return NextResponse.json({ message: "The private note could not be saved." }, { status: 500 });
  return NextResponse.json({ message: "Private staff note added." }, { headers: { "Cache-Control": "no-store" } });
}
