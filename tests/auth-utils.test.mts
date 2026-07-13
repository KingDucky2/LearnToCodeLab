import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isProtectedPath, isValidEmail, sanitizeReturnPath, validateUsername } from "../lib/auth-utils.ts";
import { clampProgress, defaultMaintenanceSettings, getCountdownRemaining, isAdminRole, isEmergencyMaintenanceValue, isMaintenanceBypassPath, isMaintenanceTaskStatus, isOwnerRole, safeMaintenanceReturnPath, shouldRedirectForMaintenance } from "../lib/maintenance.ts";

test("sanitizeReturnPath accepts same-site relative paths", () => {
  assert.equal(sanitizeReturnPath("/dashboard?tab=next"), "/dashboard?tab=next");
  assert.equal(sanitizeReturnPath("/profile#settings"), "/profile#settings");
});

test("sanitizeReturnPath rejects external and protocol-relative targets", () => {
  assert.equal(sanitizeReturnPath("https://evil.example/login"), "/dashboard");
  assert.equal(sanitizeReturnPath("//evil.example/login"), "/dashboard");
  assert.equal(sanitizeReturnPath("\\evil"), "/dashboard");
});

test("email validation accepts normal addresses and rejects malformed values", () => {
  assert.equal(isValidEmail("learner@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
});

test("username validation normalizes and blocks reserved names", () => {
  assert.deepEqual(validateUsername(" Good_Name "), { valid: true, normalized: "good_name" });
  assert.equal(validateUsername("admin").valid, false);
  assert.equal(validateUsername("bad-name").valid, false);
});

test("private account and onboarding routes are protected", () => {
  assert.equal(isProtectedPath("/dashboard"), true);
  assert.equal(isProtectedPath("/settings/privacy"), true);
  assert.equal(isProtectedPath("/onboarding"), true);
  assert.equal(isProtectedPath("/admin/maintenance"), true);
  assert.equal(isProtectedPath("/learn"), false);
});

test("maintenance routing excludes critical routes and prevents loops", () => {
  assert.equal(isMaintenanceBypassPath("/maintenance"), true);
  assert.equal(isMaintenanceBypassPath("/auth/callback"), true);
  assert.equal(isMaintenanceBypassPath("/api/maintenance/status"), true);
  assert.equal(isMaintenanceBypassPath("/learntocodelab-logo.png"), true);
  assert.equal(isMaintenanceBypassPath("/api/account/delete"), false);
  assert.equal(shouldRedirectForMaintenance({ pathname: "/learn", enabled: false, emergency: false, authenticated: false, settings: defaultMaintenanceSettings }), false);
  assert.equal(shouldRedirectForMaintenance({ pathname: "/learn", enabled: true, emergency: false, authenticated: false, settings: defaultMaintenanceSettings }), true);
  assert.equal(shouldRedirectForMaintenance({ pathname: "/maintenance", enabled: true, emergency: false, authenticated: false, settings: defaultMaintenanceSettings }), false);
});

test("maintenance access respects authenticated and admin bypass settings", () => {
  const authenticatedSettings = { ...defaultMaintenanceSettings, maintenance_enabled: true, allow_authenticated_users: true };
  assert.equal(shouldRedirectForMaintenance({ pathname: "/dashboard", enabled: true, emergency: false, authenticated: true, role: "learner", settings: authenticatedSettings }), false);
  assert.equal(shouldRedirectForMaintenance({ pathname: "/learn", enabled: true, emergency: false, authenticated: true, role: "owner", settings: defaultMaintenanceSettings }), false);
  assert.equal(shouldRedirectForMaintenance({ pathname: "/learn", enabled: true, emergency: true, authenticated: true, role: "owner", settings: defaultMaintenanceSettings }), true);
  assert.equal(shouldRedirectForMaintenance({ pathname: "/login", enabled: true, emergency: false, authenticated: false, settings: defaultMaintenanceSettings }), false);
  assert.equal(shouldRedirectForMaintenance({ pathname: "/login", enabled: true, emergency: false, authenticated: false, settings: { ...defaultMaintenanceSettings, allow_login_during_maintenance: false } }), true);
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("owner"), true);
  assert.equal(isAdminRole("moderator"), false);
  assert.equal(isOwnerRole("owner"), true);
});

test("maintenance input validation is bounded and safe", () => {
  assert.equal(clampProgress(-12), 0);
  assert.equal(clampProgress(122), 100);
  assert.equal(isMaintenanceTaskStatus("completed"), true);
  assert.equal(isMaintenanceTaskStatus("unknown"), false);
  assert.equal(safeMaintenanceReturnPath("https://evil.example"), "/");
  assert.equal(safeMaintenanceReturnPath("/maintenance?loop=1"), "/");
  assert.equal(safeMaintenanceReturnPath("/learn/python"), "/learn/python");
  assert.equal(getCountdownRemaining("2026-07-13T12:00:00Z", Date.parse("2026-07-13T12:00:01Z")), 0);
  assert.equal(getCountdownRemaining("invalid", 0), null);
  assert.equal(isEmergencyMaintenanceValue(" TRUE "), true);
  assert.equal(isEmergencyMaintenanceValue("false"), false);
});

test("maintenance migration enforces RLS, role checks, and atomic admin saves", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202607130001_maintenance_system.sql", import.meta.url), "utf8");
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /role in \('admin', 'owner'\)/);
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /save_maintenance_configuration/);
  assert.match(migration, /security definer/);
  assert.doesNotMatch(migration, /using \(true\)/i);
});
