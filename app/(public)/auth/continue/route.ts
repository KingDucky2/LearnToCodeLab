import { NextResponse } from "next/server";
import { sanitizeReturnPath } from "@/lib/auth-utils";
import { isAdminPath, isAdminRole, safeMaintenanceReturnPath } from "@/lib/maintenance";
import { getPublicMaintenanceState } from "@/lib/maintenance-server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const safeNext = sanitizeReturnPath(requestUrl.searchParams.get("next"));
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!supabase || !user) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("next", safeNext);
    return NextResponse.redirect(loginUrl);
  }

  const db = supabase as any;
  const { data: profile } = await db.from("profiles").select("role,account_status,onboarding_required,onboarding_completed").eq("id", user.id).maybeSingle();

  const maintenance = await getPublicMaintenanceState({ forceRefresh: true });
  if (!maintenance.settings.maintenance_enabled) {
    const destination = profile?.onboarding_required && !profile?.onboarding_completed ? "/onboarding" : safeNext;
    return NextResponse.redirect(new URL(destination, requestUrl.origin));
  }

  if (profile?.account_status === "suspended") {
    const supportUrl = new URL("/support", requestUrl.origin);
    supportUrl.searchParams.set("notice", "account-restricted");
    return NextResponse.redirect(supportUrl);
  }
  if (isAdminRole(profile?.role)) {
    const destination = isAdminPath(safeNext) ? safeNext : "/admin/maintenance";
    return NextResponse.redirect(new URL(destination, requestUrl.origin));
  }

  if (!maintenance.emergency && maintenance.settings.allow_authenticated_users && !isAdminPath(safeNext)) {
    const destination = profile?.onboarding_required && !profile?.onboarding_completed ? "/onboarding" : safeNext;
    return NextResponse.redirect(new URL(destination, requestUrl.origin));
  }

  const maintenanceUrl = new URL("/maintenance", requestUrl.origin);
  maintenanceUrl.searchParams.set("returnTo", safeMaintenanceReturnPath(safeNext));
  maintenanceUrl.searchParams.set("notice", "signed-in-access-restricted");
  return NextResponse.redirect(maintenanceUrl);
}
