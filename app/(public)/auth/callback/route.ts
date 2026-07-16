import { NextResponse } from "next/server";
import { getAuthErrorMessage, sanitizeAdminReturnPath, sanitizeReturnPath } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const recoveryLogin = requestUrl.searchParams.get("recovery") === "staff";
  const safeNext = recoveryLogin
    ? sanitizeAdminReturnPath(requestUrl.searchParams.get("next"), "/admin")
    : sanitizeReturnPath(requestUrl.searchParams.get("next"), "/dashboard");
  const error = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");

  function loginErrorRedirect(message: string) {
    const redirectUrl = new URL(recoveryLogin ? "/staff/sign-in" : "/login", requestUrl.origin);
    redirectUrl.searchParams.set("error", message);
    redirectUrl.searchParams.set("next", safeNext);
    return NextResponse.redirect(redirectUrl);
  }

  if (error) {
    return loginErrorRedirect(getAuthErrorMessage(error));
  }

  if (!code) {
    return loginErrorRedirect("Missing authentication code. Please try signing in again.");
  }

  const supabase = await createClient();
  if (!supabase) {
    return loginErrorRedirect("Supabase is not configured yet. Add the project URL and publishable key.");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return loginErrorRedirect(getAuthErrorMessage(exchangeError.message));
  }

  const continueUrl = new URL("/auth/continue", requestUrl.origin);
  continueUrl.searchParams.set("next", safeNext);
  return NextResponse.redirect(continueUrl);
}
