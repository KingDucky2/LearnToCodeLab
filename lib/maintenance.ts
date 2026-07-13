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
  updated_at: null
};

export const maintenanceBypassPrefixes = [
  "/maintenance",
  "/admin",
  "/auth/callback",
  "/auth/sign-out",
  "/forgot-password",
  "/reset-password",
  "/api/admin/maintenance",
  "/api/maintenance",
  "/_next",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico"
];
export const loginPrefixes = ["/login", "/signup", "/auth/sign-in", "/auth/create-account"];

export function isMaintenanceBypassPath(pathname: string) {
  if (/\.(?:css|js|map|svg|png|jpe?g|gif|webp|ico|woff2?)$/i.test(pathname)) return true;
  return maintenanceBypassPrefixes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isLoginPath(pathname: string) {
  return loginPrefixes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
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

export function clampProgress(value: number) {
  return Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));
}

export function isMaintenanceTaskStatus(value: string): value is MaintenanceTaskStatus {
  return maintenanceTaskStatuses.includes(value as MaintenanceTaskStatus);
}

export function getCountdownRemaining(target: string | null, now = Date.now()) {
  if (!target) return null;
  const targetTime = new Date(target).getTime();
  return Number.isFinite(targetTime) ? Math.max(0, targetTime - now) : null;
}

export function shouldRedirectForMaintenance(input: { pathname: string; enabled: boolean; emergency: boolean; role?: string | null; authenticated: boolean; settings: MaintenanceSettings }) {
  if (!input.enabled || isMaintenanceBypassPath(input.pathname)) return false;
  if (isLoginPath(input.pathname) && input.settings.allow_login_during_maintenance && !input.emergency) return false;
  if (!input.emergency && input.settings.allow_admin_bypass && isAdminRole(input.role)) return false;
  if (!input.emergency && input.settings.allow_authenticated_users && input.authenticated) return false;
  return true;
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
