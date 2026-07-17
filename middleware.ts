import { NextResponse, type NextRequest } from "next/server";
import { isAuthPath, isOnboardingExemptPath, isProtectedPath, isSuspendedAccountAllowedPath, sanitizeAdminReturnPath, sanitizeReturnPath } from "@/lib/auth-utils";
import { createMiddlewareClient, hasSupabaseEnv } from "@/lib/supabase/middleware";
import { getPublicMaintenanceState } from "@/lib/maintenance-server";
import { classifyMaintenancePath, getMaintenanceAccessDecision, isAdminPath, safeMaintenanceReturnPath } from "@/lib/maintenance";

function copyResponseCookies(source: NextResponse | undefined, target: NextResponse) {
  source?.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
}

function maintenanceRedirect(request: NextRequest, sourceResponse?: NextResponse, notice?: "signed-in-access-restricted") {
  const pathname = request.nextUrl.pathname;
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/maintenance";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("returnTo", safeMaintenanceReturnPath(`${pathname}${request.nextUrl.search}`));
  if (notice) redirectUrl.searchParams.set("notice", notice);
  const redirect = NextResponse.redirect(redirectUrl, 307);
  redirect.headers.set("Retry-After", "60");
  copyResponseCookies(sourceResponse, redirect);
  return redirect;
}

function staffSignInRedirect(request: NextRequest, sourceResponse?: NextResponse) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/staff/sign-in";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", sanitizeAdminReturnPath(`${request.nextUrl.pathname}${request.nextUrl.search}`, "/admin"));
  const redirect = NextResponse.redirect(redirectUrl, 307);
  copyResponseCookies(sourceResponse, redirect);
  return redirect;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Recovery, auth callbacks, status APIs, and static files never need a
  // maintenance lookup. This also prevents a bypass route from paying for an
  // RPC it will never use.
  const pathClassification = classifyMaintenancePath(pathname);
  if (pathClassification.bypassMaintenance) {
    if (!pathClassification.refreshSession || !hasSupabaseEnv()) return NextResponse.next();
    // Keep Supabase's cookie refresh behavior for session-sensitive recovery
    // and authentication routes even though maintenance data is unnecessary.
    const { supabase, response } = createMiddlewareClient(request);
    await supabase.auth.getUser();
    return response();
  }
  const maintenance = await getPublicMaintenanceState();

  if (!hasSupabaseEnv()) {
    const decision = getMaintenanceAccessDecision({ pathname, enabled: maintenance.settings.maintenance_enabled, emergency: maintenance.emergency, authenticated: false, settings: maintenance.settings });
    if (decision === "staff-sign-in") return staffSignInRedirect(request);
    if (decision === "maintenance") return maintenanceRedirect(request);
    if (isAdminPath(pathname)) return staffSignInRedirect(request);
    if (isProtectedPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = "";
      redirectUrl.searchParams.set("next", sanitizeReturnPath(`${pathname}${request.nextUrl.search}`));
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { user }
  } = await supabase.auth.getUser();
  let role: string | null = null;
  let accountStatus: string | null = null;
  let onboardingRequired = false;
  let onboardingCompleted = false;
  const needsProfile = Boolean(user && (isProtectedPath(pathname) || (maintenance.settings.maintenance_enabled && maintenance.settings.allow_admin_bypass && !maintenance.emergency)));
  if (user && needsProfile) {
    const db = supabase as any;
    const { data } = await db.from("profiles").select("role,account_status,onboarding_required,onboarding_completed").eq("id", user.id).maybeSingle();
    role = data?.role ?? null;
    accountStatus = data?.account_status ?? "active";
    onboardingRequired = data?.onboarding_required === true;
    onboardingCompleted = data?.onboarding_completed === true;
  }

  const decision = getMaintenanceAccessDecision({ pathname, enabled: maintenance.settings.maintenance_enabled, emergency: maintenance.emergency, authenticated: Boolean(user), role, settings: maintenance.settings });
  if (decision === "staff-sign-in") return staffSignInRedirect(request, response());
  if (decision === "maintenance") return maintenanceRedirect(request, response(), user ? "signed-in-access-restricted" : undefined);

  if (!user && isAdminPath(pathname)) return staffSignInRedirect(request, response());
  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", sanitizeReturnPath(`${pathname}${request.nextUrl.search}`));
    return NextResponse.redirect(redirectUrl);
  }

  if (user && accountStatus === "suspended" && isProtectedPath(pathname) && !isSuspendedAccountAllowedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/support";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("notice", "account-restricted");
    const redirect = NextResponse.redirect(redirectUrl, 307);
    copyResponseCookies(response(), redirect);
    return redirect;
  }

  if (user && onboardingRequired && !onboardingCompleted && isProtectedPath(pathname) && !isOnboardingExemptPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/onboarding";
    redirectUrl.search = "";
    const redirect = NextResponse.redirect(redirectUrl, 307);
    copyResponseCookies(response(), redirect);
    return redirect;
  }

  if (user && (pathname === "/login" || pathname === "/signup" || pathname === "/auth/sign-in" || pathname === "/auth/create-account")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/continue";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", sanitizeReturnPath(request.nextUrl.searchParams.get("next")));
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPath(pathname) && (pathname === "/forgot-password" || pathname === "/auth/forgot-password")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/settings";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response();
}

export const config = {
  runtime: "nodejs",
  // Coarse static fast path required by Next.js. classifyMaintenancePath is
  // authoritative for every request that reaches middleware.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:css|js|map|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)"]
};
