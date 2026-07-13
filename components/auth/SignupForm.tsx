"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { getAuthErrorMessage, isStrongEnoughPassword, isValidEmail, sanitizeReturnPath } from "@/lib/auth-utils";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/browser";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordGuidance } from "@/components/auth/PasswordGuidance";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const next = sanitizeReturnPath(searchParams.get("next"), "/onboarding");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!displayName.trim()) {
      setMessage({ type: "error", text: "Enter your display name." });
      return;
    }
    if (!isValidEmail(email)) {
      setMessage({ type: "error", text: "Enter a valid email address." });
      return;
    }
    if (!isStrongEnoughPassword(password)) {
      setMessage({ type: "error", text: "Use a password with at least 8 characters, a letter, and a number." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (!acceptedTerms) {
      setMessage({ type: "error", text: "Agree to the Terms and Privacy Policy to create an account." });
      return;
    }
    if (!hasSupabaseEnv()) {
      setMessage({ type: "error", text: "Supabase is not configured yet. Add the project URL and publishable key." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          data: { display_name: displayName.trim(), full_name: displayName.trim() }
        }
      });

      if (error) {
        setMessage({ type: "error", text: getAuthErrorMessage(error.message) });
        return;
      }

      if (data.session) {
        router.push(next);
        router.refresh();
        return;
      }

      setMessage({ type: "success", text: "Account created. Check your email to confirm your account before signing in." });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setMessage(null);
    if (!acceptedTerms) {
      setMessage({ type: "error", text: "Agree to the Terms and Privacy Policy before continuing with Google." });
      return;
    }
    if (!hasSupabaseEnv()) {
      setMessage({ type: "error", text: "Supabase is not configured yet. Add the project URL and publishable key." });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        scopes: "openid email profile"
      }
    });

    if (error) {
      setMessage({ type: "error", text: getAuthErrorMessage(error.message) });
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-amber-700">Create account</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-lab-navy">Start your adaptive path.</h1>
        <p className="mt-3 text-slate-600">Accounts unlock cross-device progress, onboarding, skill scores, and privacy controls.</p>
      </div>

      <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
        <label htmlFor="display-name" className="grid gap-2 text-sm font-extrabold text-slate-700">
          Display name
          <input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" type="text" autoComplete="name" placeholder="Luke Learner" />
        </label>
        <label htmlFor="signup-email" className="grid gap-2 text-sm font-extrabold text-slate-700">
          Email
          <input id="signup-email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" type="email" autoComplete="email" placeholder="you@example.com" />
        </label>
        <PasswordField id="signup-password" label="Password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
        <PasswordGuidance password={password} />
        <PasswordField id="confirm-password" label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="Repeat your password" />
        <label className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700">
          <input checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4" />
          <span>
            I agree to the{" "}
            <Link className="text-lab-blue" href="/terms">
              Terms
            </Link>{" "}
            and{" "}
            <Link className="text-lab-blue" href="/privacy">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        <button disabled={loading} className="rounded-xl bg-gradient-to-r from-lab-teal to-lab-blue px-4 py-3 font-black text-lab-navy disabled:opacity-60">
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>

      <button disabled={loading} onClick={handleGoogle} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-black text-lab-navy disabled:opacity-60">
        Continue with Google
      </button>

      <p className="mt-5 text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-black text-lab-blue" href={`/login?next=${encodeURIComponent(next)}`}>
          Sign In
        </Link>
      </p>

      {message ? (
        <div className="mt-4">
          <AuthMessage type={message.type}>{message.text}</AuthMessage>
        </div>
      ) : null}
    </div>
  );
}
