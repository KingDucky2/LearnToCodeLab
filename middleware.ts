import { NextResponse, type NextRequest } from "next/server";
import { isAuthPath, isProtectedPath, sanitizeReturnPath } from "@/lib/auth-utils";
import { createMiddlewareClient, hasSupabaseEnv } from "@/lib/supabase/middleware";
import { getPublicMaintenanceState } from "@/lib/maintenance-server";
import { getMaintenanceAccessDecision, isAdminPath, safeMaintenanceReturnPath } from "@/lib/maintenance";

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
  redirectUrl.searchParams.set("next", safeMaintenanceReturnPath(`${request.nextUrl.pathname}${request.nextUrl.search}`));
  const redirect = NextResponse.redirect(redirectUrl, 307);
  copyResponseCookies(sourceResponse, redirect);
  return redirect;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const maintenance = await getPublicMaintenanceState();

  if (!hasSupabaseEnv()) {
    const decision = getMaintenanceAccessDecision({ pathname, enabled: maintenance.settings.maintenance_enabled, emergency: maintenance.emergency, authenticated: false, settings: maintenance.settings });
    if (decision === "staff-sign-in") return staffSignInRedirect(request);
    if (decision === "maintenance") return maintenanceRedirect(request);
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
  const needsRole = Boolean(user && maintenance.settings.maintenance_enabled && (isAdminPath(pathname) || (maintenance.settings.allow_admin_bypass && !maintenance.emergency)));
  if (user && needsRole) {
    const db = supabase as any;
    const { data } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
    role = data?.role ?? null;
  }

  const decision = getMaintenanceAccessDecision({ pathname, enabled: maintenance.settings.maintenance_enabled, emergency: maintenance.emergency, authenticated: Boolean(user), role, settings: maintenance.settings });
  if (decision === "staff-sign-in") return staffSignInRedirect(request, response());
  if (decision === "maintenance") return maintenanceRedirect(request, response(), user ? "signed-in-access-restricted" : undefined);

  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", sanitizeReturnPath(`${pathname}${request.nextUrl.search}`));
    return NextResponse.redirect(redirectUrl);
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
