"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { formatSupportCategory, supportCategories } from "@/lib/support";

export function NewSupportTicketForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/support/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: form.get("subject"), category: form.get("category"), message: form.get("message"), pageUrl: form.get("pageUrl"), diagnosticsConsent: form.get("diagnosticsConsent") === "on" }) });
    const body = await response.json() as { message?: string; ticketId?: string };
    setBusy(false); setMessage({ type: response.ok ? "success" : "error", text: body.message ?? "The request could not be completed." });
    if (response.ok && body.ticketId) router.push(`/support/${body.ticketId}`);
  }
  return <form onSubmit={submit} className="surface-panel grid gap-4">
    <p className="rounded-lg bg-amber-50 p-4 text-sm font-bold text-amber-950">Do not include passwords, reset links, access tokens, payment details, or other secrets.</p>
    <label className="form-label">Subject<input className="form-control" name="subject" minLength={5} maxLength={140} required /></label>
    <label className="form-label">Category<select className="form-control" name="category" required>{supportCategories.map((category) => <option key={category} value={category}>{formatSupportCategory(category)}</option>)}</select></label>
    <label className="form-label">What happened?<textarea className="form-control min-h-40" name="message" minLength={10} maxLength={5000} required /></label>
    <label className="form-label">Related page (optional)<input className="form-control" name="pageUrl" placeholder="/learn/python" maxLength={500} /></label>
    <label className="form-choice"><input type="checkbox" name="diagnosticsConsent" className="mt-1" />Include limited browser diagnostics (browser user agent only) to help reproduce this issue.</label>
    <button className="btn-primary" disabled={busy}>{busy ? "Creating ticket…" : "Create support ticket"}</button>
    {message ? <AuthMessage type={message.type}>{message.text}</AuthMessage> : null}
  </form>;
}

export function SupportReplyForm({ ticketId, admin = false, note = false }: { ticketId: string; admin?: boolean; note?: boolean }) {
  const router = useRouter(); const [body, setBody] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(null); const url = admin ? `/api/admin/support/${ticketId}` : `/api/support/tickets/${ticketId}/messages`; const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(admin ? { action: note ? "note" : "reply", message: body } : { message: body }) }); const result = await response.json() as { message?: string }; setBusy(false); setMessage({ type: response.ok ? "success" : "error", text: result.message ?? "Reply could not be sent." }); if (response.ok) { setBody(""); router.refresh(); } }
  return <form onSubmit={submit} className="grid gap-3"><label className="form-label">{note ? "Private staff note" : "Reply"}<textarea className="form-control min-h-28" value={body} onChange={(event) => setBody(event.target.value)} minLength={2} maxLength={5000} required /></label><button className={note ? "btn-outline" : "btn-primary"} disabled={busy}>{busy ? "Saving…" : note ? "Add private note" : "Send reply"}</button>{message ? <AuthMessage type={message.type}>{message.text}</AuthMessage> : null}</form>;
}

export function SupportStatusForm({ ticketId, status, assigned }: { ticketId: string; status: string; assigned?: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  async function requestAction(payload: Record<string, string>) { setBusy(true); setFeedback(null); const response = await fetch(`/api/admin/support/${ticketId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const body = await response.json() as { message?: string }; setBusy(false); setFeedback({ type: response.ok ? "success" : "error", text: body.message ?? "The ticket could not be updated." }); if (response.ok) router.refresh(); }
  async function change(next: string) { if (!window.confirm(`Change this ticket to ${next.replaceAll("_", " ")}?`)) return; await requestAction({ action: "status", status: next }); }
  async function assign(action: "assign-self" | "unassign") { await requestAction({ action }); }
  return <div className="grid gap-3"><div className="flex flex-wrap gap-2">{status !== "resolved" ? <button className="btn-primary" disabled={busy} onClick={() => change("resolved")}>Resolve</button> : <button className="btn-outline" disabled={busy} onClick={() => change("open")}>Reopen</button>}<button className="btn-outline" disabled={busy} onClick={() => change("waiting_on_user")}>Wait on user</button><button className="btn-outline" disabled={busy} onClick={() => assign(assigned ? "unassign" : "assign-self")}>{assigned ? "Clear assignment" : "Assign to me"}</button></div>{feedback ? <AuthMessage type={feedback.type}>{feedback.text}</AuthMessage> : null}</div>;
}
