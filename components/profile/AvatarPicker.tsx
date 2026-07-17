"use client";

import { ImageUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AccountAvatar } from "@/components/AccountAvatar";
import { AuthMessage } from "@/components/auth/AuthMessage";
import type { AccountIdentity } from "@/lib/identity";

export function AvatarPicker({ identity, hasCustomAvatar }: { identity: AccountIdentity; hasCustomAvatar: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const previewIdentity = previewUrl ? { ...identity, avatarUrl: previewUrl, avatarUrls: [previewUrl], initials: identity.initials } : identity;

  function choose(next: File | undefined) {
    setMessage(null);
    if (!next) return setFile(null);
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(next.type)) return setMessage({ type: "error", text: "Use a JPEG, PNG, WebP, or GIF image." });
    if (next.size > 5 * 1024 * 1024) return setMessage({ type: "error", text: "Avatar images must be 5 MB or smaller." });
    setFile(next);
  }

  async function upload() {
    if (!file) return;
    setBusy(true); setMessage(null);
    try {
      const form = new FormData(); form.set("avatar", file);
      const response = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const body = await response.json() as { message?: string };
      setMessage({ type: response.ok ? "success" : "error", text: body.message ?? "The avatar could not be updated." });
      if (response.ok) { setFile(null); router.refresh(); }
    } catch { setMessage({ type: "error", text: "The avatar could not be updated. Check your connection and try again." }); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!window.confirm("Remove your custom avatar? Your Google avatar or initials will be used instead.")) return;
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      const body = await response.json() as { message?: string };
      setMessage({ type: response.ok ? "success" : "error", text: body.message ?? "The avatar could not be removed." });
      if (response.ok) { setFile(null); router.refresh(); }
    } catch { setMessage({ type: "error", text: "The avatar could not be removed. Check your connection and try again." }); }
    finally { setBusy(false); }
  }

  return <section className="rounded-xl border border-border bg-surface-secondary p-4" aria-labelledby="avatar-picker-title">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <AccountAvatar identity={previewIdentity} size="lg" />
      <div className="min-w-0 flex-1"><h3 id="avatar-picker-title" className="font-black text-foreground">Profile picture</h3><p className="mt-1 text-sm text-muted">Upload a square image up to 5 MB. Other shapes are displayed with a centered square crop.</p>{identity.googleConnected && !hasCustomAvatar ? <p className="mt-1 text-xs font-bold text-primary">Your Google avatar is currently being used.</p> : null}</div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2"><label className="btn-outline cursor-pointer"><ImageUp className="h-4 w-4" />{hasCustomAvatar ? "Choose replacement" : "Choose image"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => choose(event.target.files?.[0])} disabled={busy} /></label>{file ? <button type="button" className="btn-primary" onClick={upload} disabled={busy}>{busy ? "Uploading…" : "Save avatar"}</button> : null}{hasCustomAvatar ? <button type="button" className="btn-outline text-red-700" onClick={remove} disabled={busy}><Trash2 className="h-4 w-4" />Remove custom avatar</button> : null}{file ? <button type="button" className="btn-ghost" onClick={() => setFile(null)} disabled={busy}>Discard preview</button> : null}</div>
    {message ? <div className="mt-3"><AuthMessage type={message.type}>{message.text}</AuthMessage></div> : null}
  </section>;
}
