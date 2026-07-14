"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSideSupabase, hasSupabaseEnv } from "@/lib/supabase";

type Mode = "sign-in" | "create-account";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
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
      if (isCreate) {
        setMessage("Check your email to verify your account, then continue onboarding.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
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
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
    setMessage(error ? error.message : "Password reset email sent.");
  }

  return (
    <div className="glass rounded-lg p-6">
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-amber-700">{isCreate ? "Create account" : "Welcome back"}</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-foreground">{isCreate ? "Start your adaptive path." : "Continue learning."}</h1>
        <p className="mt-3 text-muted">
          {isCreate ? "Accounts unlock cross-device progress, onboarding, skill scores, and privacy controls." : "Sign in with email or Google to reach your dashboard."}
        </p>
      </div>

      <div className="grid gap-3">
        <label className="form-label">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="form-control" type="email" placeholder="you@example.com" />
        </label>
        <label className="form-label">
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} className="form-control" type="password" placeholder="At least 8 characters" />
        </label>
        <button disabled={loading} onClick={handleEmailAuth} className="btn-primary">
          {loading ? "Working..." : isCreate ? "Create account" : "Sign in"}
        </button>
        <button disabled={loading} onClick={handleGoogle} className="btn-outline">
          Continue with Google
        </button>
        {!isCreate ? (
          <button onClick={handlePasswordReset} className="text-left text-sm font-bold text-primary">
            Forgot password?
          </button>
        ) : null}
      </div>

      {message ? <p className="mt-4 rounded-lg bg-surface-secondary p-3 text-sm font-bold text-secondary">{message}</p> : null}
      <p className="mt-5 text-sm text-muted">
        {isCreate ? "Already have an account?" : "New here?"}{" "}
        <Link className="font-black text-primary" href={isCreate ? "/login" : "/signup"}>
          {isCreate ? "Sign in" : "Create account"}
        </Link>
      </p>
      {!isCreate ? (
        <p className="mt-2 text-sm text-muted">
          Need a dedicated reset page?{" "}
          <Link className="font-black text-primary" href="/forgot-password">
            Open forgot password
          </Link>
        </p>
      ) : null}
    </div>
  );
}
