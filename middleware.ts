import { NextResponse, type NextRequest } from "next/server";
import { isAuthPath, isProtectedPath, sanitizeReturnPath } from "@/lib/auth-utils";
import { createMiddlewareClient, hasSupabaseEnv } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", sanitizeReturnPath(`${pathname}${request.nextUrl.search}`));
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup" || pathname === "/auth/sign-in" || pathname === "/auth/create-account")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = sanitizeReturnPath(request.nextUrl.searchParams.get("next"));
    redirectUrl.search = "";
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
