"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";

export function UserStaffNoteForm({ userId }: { userId: string }) {
  const router = useRouter(); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setFeedback(null); try { const response = await fetch(`/api/admin/users/${userId}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) }); const body = await response.json() as { message?: string }; setFeedback({ type: response.ok ? "success" : "error", text: body.message ?? "The note could not be saved." }); if (response.ok) { setNote(""); router.refresh(); } } catch { setFeedback({ type: "error", text: "The note could not be saved. Check your connection and try again." }); } finally { setBusy(false); } }
  return <form onSubmit={submit} className="mt-4 grid gap-3"><label className="form-label">Private staff note<textarea className="form-control min-h-28" value={note} onChange={(event) => setNote(event.target.value)} minLength={2} maxLength={5000} required /></label><button className="btn-outline" disabled={busy}>{busy ? "Saving…" : "Add private note"}</button>{feedback ? <AuthMessage type={feedback.type}>{feedback.text}</AuthMessage> : null}</form>;
}
