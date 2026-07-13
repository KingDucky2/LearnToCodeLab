"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getAuthErrorMessage, isStrongEnoughPassword } from "@/lib/auth-utils";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/browser";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordGuidance } from "@/components/auth/PasswordGuidance";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>({ type: "info", text: "Checking your reset link..." });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      if (!hasSupabaseEnv()) {
        setMessage({ type: "error", text: "Supabase is not configured yet. Add the project URL and publishable key." });
        return;
      }

      const error = searchParams.get("error_description") ?? searchParams.get("error");
      if (error) {
        setMessage({ type: "error", text: getAuthErrorMessage(error) });
        return;
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (!data.session) {
        setMessage({ type: "error", text: "This password-reset link has expired or is invalid. Request a new reset link." });
        return;
      }

      setReady(true);
      setMessage(null);
    }

    checkSession();
    return () => {
      active = false;
    };
  }, [searchParams]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isStrongEnoughPassword(password)) {
      setMessage({ type: "error", text: "Use a password with at least 8 characters, a letter, and a number." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage({ type: "error", text: getAuthErrorMessage(error.message) });
        return;
      }
      setMessage({ type: "success", text: "Password updated. Redirecting to your dashboard..." });
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 800);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-xs font-black uppercase text-amber-700">New password</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-lab-navy">Create a new password.</h1>
      <p className="mt-3 text-slate-600">Use the reset link from your email, then choose a new password for your account.</p>

      <form className="mt-6 grid gap-3" onSubmit={handleUpdate}>
        <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
        <PasswordGuidance password={password} />
        <PasswordField id="new-password-confirm" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="Repeat your new password" />
        <button disabled={loading || !ready} className="rounded-xl bg-gradient-to-r from-lab-teal to-lab-blue px-4 py-3 font-black text-lab-navy disabled:opacity-60">
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>

      {message ? (
        <div className="mt-4">
          <AuthMessage type={message.type}>{message.text}</AuthMessage>
        </div>
      ) : null}

      {!ready ? (
        <Link href="/forgot-password" className="mt-5 inline-flex text-sm font-black text-lab-blue">
          Request a new reset link
        </Link>
      ) : null}
    </div>
  );
}
