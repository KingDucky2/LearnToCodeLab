import { NextResponse } from "next/server";
import { canManageAccount, canSuspendAccount } from "@/lib/admin-security";
import { getAdminContext, writeAdminAudit } from "@/lib/admin-server";
import { getSiteOrigin } from "@/lib/site-url";
import { isSameOriginMutation } from "@/lib/request-security";

type ActionPayload = { action?: "reset-password" | "resend-confirmation" | "suspend" | "restore" | "sign-out"; reason?: string };

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const { userId } = await params;
  const admin = await getAdminContext();
  if (!admin.user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (!admin.authorized) return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  if (!admin.service) return NextResponse.json({ message: "Server-side account administration is not configured." }, { status: 503 });
  const payload = (await request.json().catch(() => null)) as ActionPayload | null;
  const action = payload?.action;
  if (!action) return NextResponse.json({ message: "Choose an account action." }, { status: 400 });
  const db = admin.service as any;
  const { data: target } = await db.from("profiles").select("id,email,role,account_status").eq("id", userId).maybeSingle();
  if (!target) return NextResponse.json({ message: "Account not found." }, { status: 404 });
  const { data: authTarget } = await admin.service.auth.admin.getUserById(userId);
  const targetEmail = authTarget.user?.email;
  const allowed = (action === "suspend" || action === "restore")
    ? canSuspendAccount({ actorId: admin.user.id, actorRole: admin.role, targetId: userId, targetRole: target.role })
    : canManageAccount({ actorId: admin.user.id, actorRole: admin.role, targetId: userId, targetRole: target.role });
  if (!allowed) {
    await writeAdminAudit({ service: admin.service, actorId: admin.user.id, actorRole: admin.role || "unknown", action: `account.${action}`, targetType: "user", targetId: userId, summary: "Account action denied by role safeguards.", result: "denied" });
    return NextResponse.json({ message: "Your role cannot perform this action on that account." }, { status: 403 });
  }

  let error: { message?: string } | null = null;
  let summary = "Account action completed.";
  if (action === "reset-password") {
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count } = await db.from("admin_audit_log").select("id", { count: "exact", head: true }).eq("action", "account.reset-password").eq("target_id", userId).eq("result", "success").gte("created_at", since);
    if ((count ?? 0) > 0) {
      await writeAdminAudit({ service: admin.service, actorId: admin.user.id, actorRole: admin.role || "unknown", action: "account.reset-password", targetType: "user", targetId: userId, summary: "Password-reset assistance denied by the rate limit.", result: "denied" });
      return NextResponse.json({ message: "A reset email was already sent recently. Wait 10 minutes before trying again." }, { status: 429 });
    }
    if (!targetEmail) {
      await writeAdminAudit({ service: admin.service, actorId: admin.user.id, actorRole: admin.role || "unknown", action: "account.reset-password", targetType: "user", targetId: userId, summary: "Password-reset assistance denied because no recovery email is available.", result: "denied" });
      return NextResponse.json({ message: "This account does not have an email address for password recovery." }, { status: 409 });
    }
    const result = await admin.service.auth.resetPasswordForEmail(targetEmail, { redirectTo: `${getSiteOrigin()}/auth/callback?next=/reset-password` });
    error = result.error;
    summary = "Secure password-reset email requested.";
  } else if (action === "resend-confirmation") {
    if (!targetEmail || authTarget.user?.email_confirmed_at) {
      await writeAdminAudit({ service: admin.service, actorId: admin.user.id, actorRole: admin.role || "unknown", action: "account.resend-confirmation", targetType: "user", targetId: userId, summary: "Confirmation resend denied because it is not appropriate for this account.", result: "denied" });
      return NextResponse.json({ message: "Confirmation resend is not appropriate for this account." }, { status: 409 });
    }
    const result = await admin.service.auth.resend({ type: "signup", email: targetEmail, options: { emailRedirectTo: `${getSiteOrigin()}/auth/callback` } });
    error = result.error;
    summary = "Signup confirmation email requested.";
  } else if (action === "sign-out") {
    const sessionDb = admin.supabase as any;
    const result = await sessionDb.rpc("admin_revoke_user_sessions", { target_user_id: userId });
    error = result.error;
    summary = "All active sessions were revoked.";
  } else {
    const reason = payload?.reason?.trim() ?? "";
    if (reason.length < 3 || reason.length > 500) {
      await writeAdminAudit({ service: admin.service, actorId: admin.user.id, actorRole: admin.role || "unknown", action: `account.${action}`, targetType: "user", targetId: userId, summary: "Account status action denied because the required reason was invalid.", result: "denied" });
      return NextResponse.json({ message: "Provide a reason between 3 and 500 characters." }, { status: 400 });
    }
    const nextStatus = action === "suspend" ? "suspended" : "active";
    const sessionDb = admin.supabase as any;
    const result = await sessionDb.rpc("set_user_account_status", { target_user_id: userId, next_status: nextStatus, change_reason: reason });
    error = result.error;
    summary = nextStatus === "suspended" ? "Account suspended." : "Account restored.";
  }
  await writeAdminAudit({ service: admin.service, actorId: admin.user.id, actorRole: admin.role || "unknown", action: `account.${action}`, targetType: "user", targetId: userId, summary: error ? "Account action failed safely." : summary, result: error ? "failed" : "success" });
  if (error) return NextResponse.json({ message: "The account action could not be completed." }, { status: 500 });
  return NextResponse.json({ message: summary }, { headers: { "Cache-Control": "no-store" } });
}
