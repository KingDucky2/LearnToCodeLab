"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getAuthErrorMessage, isValidEmail } from "@/lib/auth-utils";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/browser";
import { AuthMessage } from "@/components/auth/AuthMessage";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isValidEmail(email)) {
      setMessage({ type: "error", text: "Enter a valid email address." });
      return;
    }
    if (!hasSupabaseEnv()) {
      setMessage({ type: "error", text: "Supabase is not configured yet. Add the project URL and publishable key." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
      });

      if (error) {
        setMessage({ type: "error", text: getAuthErrorMessage(error.message) });
        return;
      }

      setMessage({ type: "success", text: "If an account exists for that email, a password reset link has been sent." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-xs font-black uppercase text-amber-700">Password reset</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-lab-navy">Get back into your account.</h1>
      <p className="mt-3 text-slate-600">Enter your email and LearnToCode Lab will send a secure reset link if the account exists.</p>

      <form className="mt-6 grid gap-3" onSubmit={handleReset} noValidate>
        <label htmlFor="reset-email" className="grid gap-2 text-sm font-extrabold text-slate-700">
          Email
          <input id="reset-email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" type="email" autoComplete="email" placeholder="you@example.com" />
        </label>
        <button disabled={loading} className="rounded-xl bg-gradient-to-r from-lab-teal to-lab-blue px-4 py-3 font-black text-lab-navy disabled:opacity-60">
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      {message ? (
        <div className="mt-4">
          <AuthMessage type={message.type}>{message.text}</AuthMessage>
        </div>
      ) : null}

      <Link href="/login" className="mt-5 inline-flex text-sm font-black text-lab-blue">
        Back to sign in
      </Link>
    </div>
  );
}
