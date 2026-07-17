"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";

type Action = "reset-password" | "resend-confirmation" | "suspend" | "restore" | "sign-out";

export function AdminUserActions({ userId, status, manageable, emailConfirmed }: { userId: string; status: string; manageable: boolean; emailConfirmed: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  async function run(action: Action) {
    const destructive = action === "suspend" || action === "sign-out";
    if (destructive && !window.confirm(action === "suspend" ? "Suspend this account and block protected learner access?" : "Sign this user out of all active sessions?")) return;
    if (action === "reset-password" && !window.confirm("Send this user the secure Supabase password-reset email? No reset link or token will be shown here.")) return;
    if (action === "resend-confirmation" && !window.confirm("Resend the signup confirmation email to this user?")) return;
    setBusy(action); setMessage(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) });
      const body = await response.json() as { message?: string };
      setMessage({ type: response.ok ? "success" : "error", text: body.message ?? "The request could not be completed." });
      if (response.ok) { setReason(""); router.refresh(); }
    } catch {
      setMessage({ type: "error", text: "The request could not be completed. Check your connection and try again." });
    } finally { setBusy(null); }
  }
  if (!manageable) return <p className="text-sm text-muted">Role safeguards prevent account actions on this user.</p>;
  return <div className="grid gap-4">
    {message ? <AuthMessage type={message.type}>{message.text}</AuthMessage> : null}
    <div className="flex flex-wrap gap-2"><button className="btn-outline" disabled={Boolean(busy)} onClick={() => run("reset-password")}>{busy === "reset-password" ? "Sending…" : "Send password reset"}</button>{!emailConfirmed ? <button className="btn-outline" disabled={Boolean(busy)} onClick={() => run("resend-confirmation")}>Resend confirmation</button> : null}<button className="btn-outline" disabled={Boolean(busy)} onClick={() => run("sign-out")}>Sign out all sessions</button></div>
    <label className="form-label">Status-change reason (required for suspend or restore)<textarea className="form-control min-h-24" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is this status change needed?" /></label>
    <button className={status === "suspended" ? "btn-primary" : "btn-danger"} disabled={Boolean(busy) || reason.trim().length < 3} onClick={() => run(status === "suspended" ? "restore" : "suspend")}>{busy ? "Working…" : status === "suspended" ? "Restore account" : "Suspend account"}</button>
  </div>;
}
