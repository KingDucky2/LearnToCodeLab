import { NextResponse } from "next/server";
import { getAuthErrorMessage, sanitizeReturnPath } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const safeNext = sanitizeReturnPath(requestUrl.searchParams.get("next"), "/dashboard");
  const error = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");

  if (error) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("error", getAuthErrorMessage(error));
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("error", "Missing authentication code. Please try signing in again.");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  if (!supabase) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("error", "Supabase is not configured yet. Add the project URL and publishable key.");
    return NextResponse.redirect(redirectUrl);
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("error", getAuthErrorMessage(exchangeError.message));
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
