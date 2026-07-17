export const maintenanceTaskStatuses = ["waiting", "in_progress", "completed", "delayed"] as const;
export type MaintenanceTaskStatus = (typeof maintenanceTaskStatuses)[number];

export type MaintenanceSettings = {
  maintenance_enabled: boolean;
  maintenance_title: string;
  maintenance_message: string;
  maintenance_status: string;
  maintenance_badge_text: string;
  estimated_return_at: string | null;
  show_countdown: boolean;
  show_progress: boolean;
  progress_percent: number;
  allow_admin_bypass: boolean;
  allow_authenticated_users: boolean;
  allow_login_during_maintenance: boolean;
  show_personalized_message: boolean;
  show_saved_progress_message: boolean;
  auto_refresh_enabled: boolean;
  auto_refresh_interval_seconds: number;
  support_message: string | null;
  contact_email: string | null;
  preset_key: string | null;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  schedule_event_id: string | null;
  automatic_progress: boolean;
  automatic_messages: boolean;
  automatic_updates: boolean;
  updated_at: string | null;
};

export type MaintenanceTask = {
  id: string;
  title: string;
  description: string | null;
  status: MaintenanceTaskStatus;
  progress_percent: number | null;
  display_order: number;
  visible: boolean;
};

export type MaintenanceUpdate = {
  id: string;
  title: string;
  message: string;
  published_at: string;
  visible: boolean;
};

export type MaintenanceState = {
  settings: MaintenanceSettings;
  tasks: MaintenanceTask[];
  updates: MaintenanceUpdate[];
  emergency: boolean;
  available: boolean;
};

export type MaintenanceAccessDecision = "allow" | "maintenance" | "staff-sign-in";
export type MaintenanceOverride = "database" | "force-on" | "force-off";

export const defaultMaintenanceSettings: MaintenanceSettings = {
  maintenance_enabled: false,
  maintenance_title: "The lab is getting upgraded.",
  maintenance_message: "LearnToCode Lab is temporarily offline while reliability, lessons, and learning tools are being improved.",
  maintenance_status: "upgrading",
  maintenance_badge_text: "Scheduled maintenance",
  estimated_return_at: null,
  show_countdown: false,
  show_progress: true,
  progress_percent: 35,
  allow_admin_bypass: true,
  allow_authenticated_users: false,
  allow_login_during_maintenance: true,
  show_personalized_message: true,
  show_saved_progress_message: true,
  auto_refresh_enabled: true,
  auto_refresh_interval_seconds: 60,
  support_message: "Thanks for your patience while we make the lab better.",
  contact_email: null,
  preset_key: null,
  scheduled_start_at: null,
  scheduled_end_at: null,
  schedule_event_id: null,
  automatic_progress: false,
  automatic_messages: false,
  automatic_updates: false,
  updated_at: null
};

const maintenanceSessionBypassPrefixes = [
  "/maintenance",
  "/staff/sign-in",
  "/auth/callback",
  "/auth/continue",
  "/auth/sign-out",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/forgot-password",
  "/reset-password",
  "/support",
  "/api/support",
  "/api/auth",
  "/api/admin/maintenance",
  "/api/maintenance"
];
const staticAssetPattern = /\.(?:avif|css|gif|ico|jpe?g|js|map|png|svg|ttf|webmanifest|webp|woff2?)$/i;
const staticExactPaths = new Set(["/favicon.ico", "/robots.txt", "/sitemap.xml"]);
export const loginPrefixes = ["/login", "/signup", "/auth/sign-in", "/auth/create-account"];

export type MaintenancePathClassification = {
  bypassMaintenance: boolean;
  refreshSession: boolean;
  staticAsset: boolean;
};

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Authoritative in-app route classification. The middleware matcher is only a
 * coarse, statically analyzable fast path; every request that reaches
 * middleware is classified here before maintenance or session work begins.
 */
export function classifyMaintenancePath(pathname: string): MaintenancePathClassification {
  const staticAsset = pathname === "/_next" || pathname.startsWith("/_next/") || staticExactPaths.has(pathname) || staticAssetPattern.test(pathname);
  if (staticAsset) return { bypassMaintenance: true, refreshSession: false, staticAsset: true };
  if (pathname === "/api/maintenance/status") return { bypassMaintenance: true, refreshSession: false, staticAsset: false };
  if (pathname === "/api/cron/maintenance") return { bypassMaintenance: true, refreshSession: false, staticAsset: false };
  if (maintenanceSessionBypassPrefixes.some((prefix) => matchesPrefix(pathname, prefix))) {
    return { bypassMaintenance: true, refreshSession: true, staticAsset: false };
  }
  return { bypassMaintenance: false, refreshSession: true, staticAsset: false };
}

export function isMaintenanceBypassPath(pathname: string) {
  return classifyMaintenancePath(pathname).bypassMaintenance;
}

export function isLoginPath(pathname: string) {
  return loginPrefixes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isAdminRole(role: string | null | undefined) {
  return role === "admin" || role === "owner";
}

export function isOwnerRole(role: string | null | undefined) {
  return role === "owner";
}

export function isEmergencyMaintenanceValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "true";
}

export function resolveMaintenanceOverride(override: string | null | undefined, legacyMode: string | null | undefined): MaintenanceOverride {
  const normalized = override?.trim().toLowerCase();
  if (normalized === "force-on" || normalized === "force-off" || normalized === "database") return normalized;
  return isEmergencyMaintenanceValue(legacyMode) ? "force-on" : "database";
}

export function clampProgress(value: number) {
  return Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));
}

export function getAutomaticMaintenanceStage(progress: number) {
  if (progress >= 90) return "Services are preparing to return online";
  if (progress >= 70) return "Final checks are being completed";
  if (progress >= 20) return "Maintenance is underway";
  return "Preparing systems";
}

export function isMaintenanceTaskStatus(value: string): value is MaintenanceTaskStatus {
  return maintenanceTaskStatuses.includes(value as MaintenanceTaskStatus);
}

export function getCountdownRemaining(target: string | null, now = Date.now()) {
  if (!target) return null;
  const targetTime = new Date(target).getTime();
  return Number.isFinite(targetTime) ? Math.max(0, targetTime - now) : null;
}

export function getMaintenanceAccessDecision(input: { pathname: string; enabled: boolean; emergency: boolean; role?: string | null; authenticated: boolean; settings: MaintenanceSettings }): MaintenanceAccessDecision {
  if (!input.enabled || isMaintenanceBypassPath(input.pathname)) return "allow";

  if (isAdminPath(input.pathname)) {
    if (!input.authenticated) return "staff-sign-in";
    return isAdminRole(input.role) ? "allow" : "maintenance";
  }

  if (isLoginPath(input.pathname) && input.settings.allow_login_during_maintenance && !input.emergency) return "allow";
  if (!input.emergency && input.settings.allow_admin_bypass && isAdminRole(input.role)) return "allow";
  if (!input.emergency && input.settings.allow_authenticated_users && input.authenticated) return "allow";
  return "maintenance";
}

export function shouldRedirectForMaintenance(input: { pathname: string; enabled: boolean; emergency: boolean; role?: string | null; authenticated: boolean; settings: MaintenanceSettings }) {
  return getMaintenanceAccessDecision(input) === "maintenance";
}

export function safeMaintenanceReturnPath(value: string | null | undefined) {
  if (!value) return "/";
  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\") || decoded.includes("\n") || decoded.includes("\r") || decoded.startsWith("/maintenance")) return "/";
    const url = new URL(decoded, "https://learntocodelab.com");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
