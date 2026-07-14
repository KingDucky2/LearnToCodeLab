"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { getAuthErrorMessage, isValidEmail, sanitizeAdminReturnPath, sanitizeReturnPath } from "@/lib/auth-utils";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/browser";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { PasswordField } from "@/components/auth/PasswordField";

export function LoginForm({ mode = "learner" }: { mode?: "learner" | "staff" }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(() => {
    const error = searchParams.get("error");
    return error ? { type: "error", text: getAuthErrorMessage(error) } : null;
  });
  const [loading, setLoading] = useState(false);
  const next = mode === "staff" ? sanitizeAdminReturnPath(searchParams.get("next")) : sanitizeReturnPath(searchParams.get("next"));
  const isStaff = mode === "staff";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isValidEmail(email)) {
      setMessage({ type: "error", text: "Enter a valid email address." });
      return;
    }
    if (!password) {
      setMessage({ type: "error", text: "Enter your password." });
      return;
    }
    if (!hasSupabaseEnv()) {
      setMessage({ type: "error", text: "Supabase is not configured yet. Add the project URL and publishable key." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMessage({ type: "error", text: getAuthErrorMessage(error.message) });
        return;
      }
      window.location.assign(`/auth/continue?next=${encodeURIComponent(next)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setMessage(null);
    if (!hasSupabaseEnv()) {
      setMessage({ type: "error", text: "Supabase is not configured yet. Add the project URL and publishable key." });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}${isStaff ? "&recovery=staff" : ""}`,
        scopes: "openid email profile"
      }
    });

    if (error) {
      setMessage({ type: "error", text: getAuthErrorMessage(error.message) });
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-lg p-6">
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-amber-700">{isStaff ? "Staff access" : "Sign in"}</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-foreground sm:text-4xl">{isStaff ? "Staff sign in." : "Continue learning."}</h1>
        <p className="mt-3 text-muted">{isStaff ? "Sign in with an authorized staff account. Access is verified securely after authentication." : "Sign in with email or Google to reach your dashboard and saved progress."}</p>
      </div>

      <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
        <label htmlFor="email" className="form-label">
          Email
          <input id="email" value={email} onChange={(event) => setEmail(event.target.value)} className="form-control" type="email" autoComplete="email" placeholder="you@example.com" />
        </label>
        <PasswordField id="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" placeholder="Your password" />
        <button disabled={loading} className="btn-primary">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <button disabled={loading} onClick={handleGoogle} className="mt-3 w-full btn-outline">
        Continue with Google
      </button>

      <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm">
        <Link className="font-black text-primary" href="/forgot-password">
          Forgot password?
        </Link>
        {isStaff ? <Link className="font-black text-primary" href="/maintenance">Back to maintenance</Link> : (
          <Link className="font-black text-primary" href={`/signup?next=${encodeURIComponent(next)}`}>
            Create Account
          </Link>
        )}
      </div>

      {message ? (
        <div className="mt-4">
          <AuthMessage type={message.type}>{message.text}</AuthMessage>
        </div>
      ) : null}
    </div>
  );
}
