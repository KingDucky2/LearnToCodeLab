"use client";

import { useState } from "react";
import Link from "next/link";
import { createClientSideSupabase, hasSupabaseEnv } from "@/lib/supabase";

type Mode = "sign-in" | "create-account";

export function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isCreate = mode === "create-account";
  const envReady = hasSupabaseEnv();

  async function handleEmailAuth() {
    setLoading(true);
    setMessage("");
    try {
      if (!envReady) {
        setMessage("Supabase env vars are not configured yet. Add them in Vercel and .env.local.");
        return;
      }
      const supabase = createClientSideSupabase();
      const callbackUrl = `${window.location.origin}/auth/callback?next=/onboarding`;
      const result = isCreate
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callbackUrl } })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }
      setMessage(isCreate ? "Check your email to verify your account, then continue onboarding." : "Signed in. Open your dashboard to continue.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setMessage("");
    try {
      if (!envReady) {
        setMessage("Supabase env vars are not configured yet. Google OAuth will work after setup.");
        return;
      }
      const supabase = createClientSideSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` }
      });
      if (error) setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      setMessage("Enter your email first, then request a password reset.");
      return;
    }
    if (!envReady) {
      setMessage("Supabase env vars are not configured yet.");
      return;
    }
    const supabase = createClientSideSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/settings` });
    setMessage(error ? error.message : "Password reset email sent.");
  }

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-amber-700">{isCreate ? "Create account" : "Welcome back"}</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-lab-navy">{isCreate ? "Start your adaptive path." : "Continue learning."}</h1>
        <p className="mt-3 text-slate-600">
          {isCreate ? "Accounts unlock cross-device progress, onboarding, skill scores, and privacy controls." : "Sign in with email or Google to reach your dashboard."}
        </p>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-extrabold text-slate-700">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" type="email" placeholder="you@example.com" />
        </label>
        <label className="grid gap-2 text-sm font-extrabold text-slate-700">
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" type="password" placeholder="At least 8 characters" />
        </label>
        <button disabled={loading} onClick={handleEmailAuth} className="rounded-xl bg-gradient-to-r from-lab-teal to-lab-blue px-4 py-3 font-black text-lab-navy disabled:opacity-60">
          {loading ? "Working..." : isCreate ? "Create account" : "Sign in"}
        </button>
        <button disabled={loading} onClick={handleGoogle} className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-black text-lab-navy disabled:opacity-60">
          Continue with Google
        </button>
        {!isCreate ? (
          <button onClick={handlePasswordReset} className="text-left text-sm font-bold text-lab-blue">
            Forgot password?
          </button>
        ) : null}
      </div>

      {message ? <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-700">{message}</p> : null}
      <p className="mt-5 text-sm text-slate-600">
        {isCreate ? "Already have an account?" : "New here?"}{" "}
        <Link className="font-black text-lab-blue" href={isCreate ? "/auth/sign-in" : "/auth/create-account"}>
          {isCreate ? "Sign in" : "Create account"}
        </Link>
      </p>
    </div>
  );
}
