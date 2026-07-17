import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalRouteWithSearch, isProtectedPath, isValidEmail, sanitizeAdminReturnPath, sanitizeReturnPath, validateUsername } from "../lib/auth-utils.ts";
import { clampProgress, defaultMaintenanceSettings, getCountdownRemaining, getMaintenanceAccessDecision, isAdminRole, isEmergencyMaintenanceValue, isMaintenanceBypassPath, isMaintenanceTaskStatus, isOwnerRole, resolveMaintenanceOverride, safeMaintenanceReturnPath, shouldRedirectForMaintenance } from "../lib/maintenance.ts";

test("sanitizeReturnPath accepts same-site relative paths", () => {
  assert.equal(sanitizeReturnPath("/dashboard?tab=next"), "/dashboard?tab=next");
  assert.equal(sanitizeReturnPath("/profile#settings"), "/profile#settings");
});

test("sanitizeReturnPath rejects external and protocol-relative targets", () => {
  assert.equal(sanitizeReturnPath("https://evil.example/login"), "/dashboard");
  assert.equal(sanitizeReturnPath("//evil.example/login"), "/dashboard");
  assert.equal(sanitizeReturnPath("\\evil"), "/dashboard");
});

test("canonical auth aliases preserve query parameters without interpreting them", () => {
  assert.equal(canonicalRouteWithSearch("/login", { next: "/dashboard?tab=1", error: "Try again" }), "/login?next=%2Fdashboard%3Ftab%3D1&error=Try+again");
  assert.equal(canonicalRouteWithSearch("/signup", {}), "/signup");
  assert.equal(canonicalRouteWithSearch("/login", { tag: ["one", "two"] }), "/login?tag=one&tag=two");
  assert.equal(sanitizeReturnPath("https://evil.example", "/login"), "/login");
});

test("staff recovery accepts only safe admin return paths", () => {
  assert.equal(sanitizeAdminReturnPath("/admin"), "/admin");
  assert.equal(sanitizeAdminReturnPath("/admin/maintenance?tab=status"), "/admin/maintenance?tab=status");
  assert.equal(sanitizeAdminReturnPath("/dashboard"), "/admin/maintenance");
  assert.equal(sanitizeAdminReturnPath("https://evil.example/admin"), "/admin/maintenance");
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
  assert.equal(isMaintenanceBypassPath("/staff/sign-in"), true);
  assert.equal(isMaintenanceBypassPath("/auth/callback"), true);
  assert.equal(isMaintenanceBypassPath("/auth/continue"), true);
  assert.equal(isMaintenanceBypassPath("/auth/sign-out"), true);
  assert.equal(isMaintenanceBypassPath("/forgot-password"), true);
  assert.equal(isMaintenanceBypassPath("/reset-password"), true);
  assert.equal(isMaintenanceBypassPath("/api/maintenance/status"), true);
  assert.equal(isMaintenanceBypassPath("/learntocodelab-logo-light.png"), true);
  assert.equal(isMaintenanceBypassPath("/_next/static/chunks/app.js"), true);
  assert.equal(isMaintenanceBypassPath("/favicon-32x32.png"), true);
  assert.equal(isMaintenanceBypassPath("/admin"), false);
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
  assert.equal(shouldRedirectForMaintenance({ pathname: "/signup", enabled: true, emergency: false, authenticated: false, settings: defaultMaintenanceSettings }), false);
  assert.equal(shouldRedirectForMaintenance({ pathname: "/login", enabled: true, emergency: false, authenticated: false, settings: { ...defaultMaintenanceSettings, allow_login_during_maintenance: false } }), true);
  assert.equal(shouldRedirectForMaintenance({ pathname: "/signup", enabled: true, emergency: false, authenticated: false, settings: { ...defaultMaintenanceSettings, allow_login_during_maintenance: false } }), true);
  assert.equal(getMaintenanceAccessDecision({ pathname: "/staff/sign-in", enabled: true, emergency: true, authenticated: false, settings: defaultMaintenanceSettings }), "allow");
  assert.equal(getMaintenanceAccessDecision({ pathname: "/admin/maintenance", enabled: true, emergency: false, authenticated: false, settings: defaultMaintenanceSettings }), "staff-sign-in");
  assert.equal(getMaintenanceAccessDecision({ pathname: "/admin/maintenance", enabled: true, emergency: true, authenticated: true, role: "owner", settings: defaultMaintenanceSettings }), "allow");
  assert.equal(getMaintenanceAccessDecision({ pathname: "/admin", enabled: true, emergency: false, authenticated: true, role: "learner", settings: defaultMaintenanceSettings }), "maintenance");
  assert.equal(getMaintenanceAccessDecision({ pathname: "/dashboard", enabled: true, emergency: false, authenticated: true, role: "learner", settings: { ...defaultMaintenanceSettings, allow_authenticated_users: false } }), "maintenance");
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("owner"), true);
  assert.equal(isAdminRole("moderator"), false);
  assert.equal(isOwnerRole("owner"), true);
});

test("maintenance override precedence supports emergency recovery", () => {
  assert.equal(resolveMaintenanceOverride("force-off", "true"), "force-off");
  assert.equal(resolveMaintenanceOverride("force-on", "false"), "force-on");
  assert.equal(resolveMaintenanceOverride("database", "true"), "database");
  assert.equal(resolveMaintenanceOverride(undefined, "true"), "force-on");
  assert.equal(resolveMaintenanceOverride(undefined, "false"), "database");
  assert.equal(resolveMaintenanceOverride("invalid", "false"), "database");
});

test("maintenance save refreshes server and public state promptly", () => {
  const server = readFileSync(new URL("../lib/maintenance-server.ts", import.meta.url), "utf8");
  const api = readFileSync(new URL("../app/api/admin/maintenance/route.ts", import.meta.url), "utf8");
  const statusApi = readFileSync(new URL("../app/api/maintenance/status/route.ts", import.meta.url), "utf8");
  assert.match(server, /maintenanceStateCacheTtlMs = 1_000/);
  assert.match(server, /forceRefresh = false/);
  assert.match(api, /invalidateMaintenanceStateCache\(\)/);
  assert.match(api, /revalidatePath\("\/", "layout"\)/);
  assert.match(statusApi, /forceRefresh: true/);
});

test("maintenance page always exposes neutral staff recovery", () => {
  const experience = readFileSync(new URL("../components/maintenance/MaintenanceExperience.tsx", import.meta.url), "utf8");
  const middleware = readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
  assert.match(experience, /Staff sign in/);
  assert.match(experience, /\/staff\/sign-in\?next=%2Fadmin%2Fmaintenance/);
  assert.match(experience, /settings\.allow_login_during_maintenance/);
  assert.match(middleware, /decision === "staff-sign-in"/);
  assert.match(middleware, /signed-in-access-restricted/);
});

test("admin shell provides real navigation and mobile controls", () => {
  const shell = readFileSync(new URL("../components/admin/AdminShell.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../app/(admin)/admin/layout.tsx", import.meta.url), "utf8");
  assert.match(shell, /Overview/);
  assert.match(shell, /Maintenance/);
  assert.match(shell, /aria-label="Open admin navigation"/);
  assert.match(shell, /aria-current=\{active \? "page"/);
  assert.match(shell, /AdminShell/);
  assert.match(layout, /requireAdmin\(\)/);
  assert.match(layout, /staff\/sign-in\?next=\/admin/);
});

test("maintenance editor uses explicit creation, validation, confirmation, and dirty-state actions", () => {
  const editor = readFileSync(new URL("../components/admin/MaintenanceAdminForm.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(editor, /title: "New task"/);
  assert.doesNotMatch(editor, /title: "Maintenance update"/);
  assert.match(editor, /Every task needs a title/);
  assert.match(editor, /Every update needs a title and message/);
  assert.match(editor, /Unsaved changes/);
  assert.match(editor, /Discard/);
  assert.match(editor, /beforeunload/);
  assert.match(editor, /Delete this \$\{kind\}/);
  assert.match(editor, /Move task up/);
  assert.match(editor, /Move task down/);
  assert.match(editor, /role="tablist"/);
  assert.match(editor, /aria-selected=\{activeTab === tab.id\}/);
});

test("public maintenance UI handles expiration, local time, empty sections, and hidden-tab polling", () => {
  const experience = readFileSync(new URL("../components/maintenance/MaintenanceExperience.tsx", import.meta.url), "utf8");
  assert.match(experience, /Maintenance should be complete soon/);
  assert.match(experience, /local time/);
  assert.match(experience, /document\.visibilityState !== "visible"/);
  assert.match(experience, /visibilitychange/);
  assert.match(experience, /tasks\.length \?/);
  assert.match(experience, /updates\.length \?/);
  assert.match(experience, /Admin Preview/);
  assert.match(experience, /Saved data only/);
  assert.match(experience, /aria-label=\{`\$\{task\.title\} progress`\}/);
});

test("middleware skips maintenance lookup for bypass and static routes", () => {
  const middleware = readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
  const bypassIndex = middleware.indexOf("if (pathClassification.bypassMaintenance)");
  const lookupIndex = middleware.indexOf("await getPublicMaintenanceState()");
  assert.ok(bypassIndex > -1 && bypassIndex < lookupIndex);
  assert.match(middleware, /classifyMaintenancePath\(pathname\)/);
  assert.match(middleware, /css\|js\|map/);
  assert.match(middleware, /woff\|woff2\|ttf/);
});

test("post-login routing verifies roles server-side during maintenance", () => {
  const continuation = readFileSync(new URL("../app/(public)/auth/continue/route.ts", import.meta.url), "utf8");
  const callback = readFileSync(new URL("../app/(public)/auth/callback/route.ts", import.meta.url), "utf8");
  const login = readFileSync(new URL("../components/auth/LoginForm.tsx", import.meta.url), "utf8");
  assert.match(continuation, /select\("role,account_status"\)/);
  assert.match(continuation, /isAdminRole\(profile\?\.role\)/);
  assert.match(continuation, /"\/admin\/maintenance"/);
  assert.match(continuation, /allow_authenticated_users/);
  assert.match(continuation, /signed-in-access-restricted/);
  assert.match(callback, /new URL\("\/auth\/continue"/);
  assert.match(callback, /recoveryLogin \? "\/staff\/sign-in" : "\/login"/);
  assert.match(login, /window\.location\.assign\(`\/auth\/continue\?next=/);
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

test("onboarding keeps accessible selected states and responsive navigation", () => {
  const onboarding = readFileSync(new URL("../components/OnboardingForm.tsx", import.meta.url), "utf8");
  const navigation = readFileSync(new URL("../components/AppNavClient.tsx", import.meta.url), "utf8");
  const brandLogo = readFileSync(new URL("../components/BrandLogo.tsx", import.meta.url), "utf8");
  const practice = readFileSync(new URL("../components/PracticeEngine.tsx", import.meta.url), "utf8");
  assert.match(onboarding, /role=\{multi \? "group" : "radiogroup"\}/);
  assert.match(onboarding, /aria-checked=\{isSelected\}/);
  assert.match(onboarding, /bg-\[#dff1ff\] text-\[#06172f\]/);
  assert.match(onboarding, /md:grid-cols-2/);
  assert.match(onboarding, /focus-visible:ring/);
  assert.match(onboarding, /disabled:text-slate-200/);
  assert.match(navigation, /aria-controls="mobile-navigation"/);
  assert.match(navigation, /aria-expanded=\{menuOpen\}/);
  assert.match(navigation, /lg:hidden/);
  assert.match(navigation, /<BrandLogo \/>/);
  assert.doesNotMatch(navigation, />\s*L\s*</);
  assert.match(brandLogo, /learntocodelab-logo-light\.png/);
  assert.match(brandLogo, /learntocodelab-logo-dark\.png/);
  assert.match(brandLogo, /alt="LearnToCodeLab logo"/);
  assert.match(brandLogo, /onError=\{hideFailedLogo\}/);
  assert.match(navigation, /<details/);
  assert.match(practice, /role="radiogroup"/);
  assert.match(practice, /aria-checked=\{selected === choice\}/);
});
