"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";

export function CloseTicketButton({ ticketId }: { ticketId: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  return <div className="grid gap-2"><button type="button" className="btn-outline" disabled={busy} onClick={async () => { if (!window.confirm("Close this resolved ticket? You will not be able to add more replies.")) return; setBusy(true); setError(""); try { const response = await fetch(`/api/support/tickets/${ticketId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "close" }) }); const body = await response.json() as { message?: string }; if (response.ok) router.refresh(); else setError(body.message ?? "The ticket could not be closed."); } catch { setError("The ticket could not be closed. Check your connection and try again."); } finally { setBusy(false); } }}>{busy ? "Closing…" : "Close resolved ticket"}</button>{error ? <AuthMessage type="error">{error}</AuthMessage> : null}</div>;
}
