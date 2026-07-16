import { createClient as createPublicClient } from "@supabase/supabase-js";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { defaultMaintenanceSettings, isAdminRole, resolveMaintenanceOverride, type MaintenanceOverride, type MaintenanceState } from "@/lib/maintenance";

const publicStateCache = new Map<string, { expiresAt: number; state: MaintenanceState }>();
export const maintenanceStateCacheTtlMs = 1_000;

export function invalidateMaintenanceStateCache() {
  publicStateCache.clear();
}

export function getMaintenanceOverride(): MaintenanceOverride {
  return resolveMaintenanceOverride(process.env.MAINTENANCE_OVERRIDE, process.env.MAINTENANCE_MODE);
}

export function isEmergencyMaintenanceEnabled() {
  return getMaintenanceOverride() === "force-on";
}

export function getEmergencyMaintenanceState(): MaintenanceState {
  const estimated = process.env.MAINTENANCE_ESTIMATED_RETURN?.trim() || null;
  return {
    settings: {
      ...defaultMaintenanceSettings,
      maintenance_enabled: true,
      maintenance_title: process.env.MAINTENANCE_TITLE?.trim() || defaultMaintenanceSettings.maintenance_title,
      maintenance_message: process.env.MAINTENANCE_MESSAGE?.trim() || defaultMaintenanceSettings.maintenance_message,
      estimated_return_at: estimated,
      show_countdown: Boolean(estimated),
      allow_admin_bypass: false,
      allow_authenticated_users: false,
      allow_login_during_maintenance: false
    },
    tasks: [],
    updates: [],
    emergency: true,
    available: true
  };
}

export async function getPublicMaintenanceState({ forceRefresh = false }: { forceRefresh?: boolean } = {}): Promise<MaintenanceState> {
  const override = getMaintenanceOverride();
  if (override === "force-on") return getEmergencyMaintenanceState();
  if (override === "force-off") return { settings: { ...defaultMaintenanceSettings, maintenance_enabled: false }, tasks: [], updates: [], emergency: false, available: true };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { settings: defaultMaintenanceSettings, tasks: [], updates: [], emergency: false, available: false };

  const cacheKey = `${url}:${key.slice(-12)}`;
  const cached = publicStateCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached.state;

  try {
    const supabase = createPublicClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc("get_public_maintenance_state");
    if (error || !data || typeof data !== "object") throw error ?? new Error("Maintenance state unavailable");
    const payload = data as unknown as { settings?: Partial<MaintenanceState["settings"]>; tasks?: MaintenanceState["tasks"]; updates?: MaintenanceState["updates"] };
    const state: MaintenanceState = {
      settings: { ...defaultMaintenanceSettings, ...(payload.settings ?? {}) },
      tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
      updates: Array.isArray(payload.updates) ? payload.updates : [],
      emergency: false,
      available: true
    };
    publicStateCache.set(cacheKey, { expiresAt: Date.now() + maintenanceStateCacheTtlMs, state });
    return state;
  } catch {
    return { settings: defaultMaintenanceSettings, tasks: [], updates: [], emergency: false, available: false };
  }
}

export const getCurrentUserRole = cache(async function getCurrentUserRole() {
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !user) return { supabase, user: null, role: null, profile: null };
  const db = supabase as any;
  const { data } = await db.from("profiles").select("role,display_name,avatar_url,preferred_language").eq("id", user.id).maybeSingle();
  return { supabase, user, role: (data?.role as string | undefined) ?? "learner", profile: data ?? null };
});

export const requireAdmin = cache(async function requireAdmin() {
  const session = await getCurrentUserRole();
  return { ...session, authorized: Boolean(session.user && isAdminRole(session.role)) };
});
