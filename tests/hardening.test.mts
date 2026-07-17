import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getNextTabIndex } from "../lib/accessibility.ts";
import { sanitizeAdminReturnPath } from "../lib/auth-utils.ts";
import { getInitials, normalizeAvatarUrl, resolveAccountIdentity } from "../lib/identity.ts";
import { classifyMaintenancePath, isAdminRole } from "../lib/maintenance.ts";

test("exact admin return destinations remain internal and loop-free", () => {
  assert.equal(sanitizeAdminReturnPath("/admin", "/admin"), "/admin");
  assert.equal(sanitizeAdminReturnPath("/admin/maintenance", "/admin"), "/admin/maintenance");
  assert.equal(sanitizeAdminReturnPath("/admin/maintenance/preview?mode=mobile", "/admin"), "/admin/maintenance/preview?mode=mobile");
  assert.equal(sanitizeAdminReturnPath("/staff/sign-in?next=/admin", "/admin"), "/admin");
  assert.equal(sanitizeAdminReturnPath("https://evil.example/admin", "/admin"), "/admin");
  assert.equal(sanitizeAdminReturnPath("//evil.example/admin", "/admin"), "/admin");
});

test("admin and owner are authorized while learner and OAuth metadata roles are not", () => {
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("owner"), true);
  assert.equal(isAdminRole("learner"), false);
  const identity = resolveAccountIdentity({ email: "learner@example.com", user_metadata: { role: "owner" }, identities: [] });
  assert.equal("role" in identity, false);
});

test("maintenance classification keeps static and recovery routes out of maintenance lookup", () => {
  for (const path of ["/_next/static/app.js", "/_next/image", "/logo.svg", "/font.woff2", "/styles.css", "/favicon.ico", "/robots.txt", "/sitemap.xml"]) {
    assert.deepEqual(classifyMaintenancePath(path), { bypassMaintenance: true, refreshSession: false, staticAsset: true });
  }
  assert.deepEqual(classifyMaintenancePath("/api/maintenance/status"), { bypassMaintenance: true, refreshSession: false, staticAsset: false });
  for (const path of ["/maintenance", "/staff/sign-in", "/auth/callback", "/auth/continue", "/forgot-password", "/reset-password", "/api/admin/maintenance"]) {
    assert.deepEqual(classifyMaintenancePath(path), { bypassMaintenance: true, refreshSession: true, staticAsset: false });
  }
  assert.equal(classifyMaintenancePath("/admin").bypassMaintenance, false);
});

test("stored avatar wins over provider metadata and Google uses actual identities", () => {
  const identity = resolveAccountIdentity(
    {
      email: "ada@example.com",
      user_metadata: { avatar_url: "https://metadata.example/avatar.png" },
      identities: [{ provider: "google", identity_data: { picture: "https://lh3.googleusercontent.com/provider.png", name: "Ada Provider" } }]
    },
    { display_name: "Ada Lovelace", avatar_url: "https://cdn.example.com/stored.png" }
  );
  assert.equal(identity.avatarUrl, "https://cdn.example.com/stored.png");
  assert.deepEqual(identity.avatarUrls, ["https://cdn.example.com/stored.png", "https://lh3.googleusercontent.com/provider.png", "https://metadata.example/avatar.png"]);
  assert.equal(identity.googleConnected, true);
  assert.equal(identity.label, "Ada Lovelace");
  assert.equal(identity.initials, "AL");
});

test("provider avatar supports picture and invalid stored URLs fall back safely", () => {
  const identity = resolveAccountIdentity(
    { email: "grace@example.com", identities: [{ provider: "google", identity_data: { picture: "https://lh3.googleusercontent.com/grace.png", full_name: "Grace Hopper" } }] },
    { avatar_url: "javascript:alert(1)" }
  );
  assert.equal(identity.avatarUrl, "https://lh3.googleusercontent.com/grace.png");
  assert.equal(identity.initials, "GH");
  assert.equal(normalizeAvatarUrl("not a url"), null);
  assert.equal(normalizeAvatarUrl("http://remote.example/avatar.png"), null);
});

test("initials fallback is stable", () => {
  assert.equal(getInitials("Ada Lovelace"), "AL");
  assert.equal(getInitials("learner@example.com"), "LE");
  assert.equal(getInitials(""), "L");
  const identity = resolveAccountIdentity({ email: "solo@example.com", identities: [] });
  assert.equal(identity.avatarUrl, null);
  assert.equal(identity.initials, "SO");
  assert.equal(identity.googleConnected, false);
});

test("tab keyboard navigation wraps and supports Home and End", () => {
  assert.equal(getNextTabIndex(0, "ArrowLeft", 4), 3);
  assert.equal(getNextTabIndex(3, "ArrowRight", 4), 0);
  assert.equal(getNextTabIndex(2, "Home", 4), 0);
  assert.equal(getNextTabIndex(1, "End", 4), 3);
});

test("admin layout excludes public chrome instead of hiding it", () => {
  const rootLayout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const publicLayout = readFileSync(new URL("../app/(public)/layout.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(rootLayout, /AppNav|AppFooter/);
  assert.match(publicLayout, /<AppNav \/>/);
  assert.match(publicLayout, /<AppFooter \/>/);
  assert.doesNotMatch(styles, /body:has\(\[data-admin-page\]\)/);
});

test("admin recovery, layout authorization, and child pages use consistent boundaries", () => {
  const middleware = readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../app/(admin)/admin/layout.tsx", import.meta.url), "utf8");
  const callback = readFileSync(new URL("../app/(public)/auth/callback/route.ts", import.meta.url), "utf8");
  const maintenancePage = readFileSync(new URL("../app/(admin)/admin/maintenance/page.tsx", import.meta.url), "utf8");
  const previewPage = readFileSync(new URL("../app/(admin)/admin/maintenance/preview/page.tsx", import.meta.url), "utf8");
  assert.match(middleware, /sanitizeAdminReturnPath\(`\$\{request\.nextUrl\.pathname\}\$\{request\.nextUrl\.search\}`/);
  assert.match(middleware, /!user && isAdminPath\(pathname\)/);
  assert.match(layout, /if \(!admin\.authorized\) redirect\("\/dashboard"\)/);
  assert.match(callback, /recoveryLogin[\s\S]*sanitizeAdminReturnPath/);
  assert.doesNotMatch(maintenancePage, /redirect\(/);
  assert.doesNotMatch(previewPage, /redirect\(/);
});

test("dialog, progressive maintenance controls, polling, and avatar surfaces contain the hardened behavior", () => {
  const editor = readFileSync(new URL("../components/admin/MaintenanceAdminForm.tsx", import.meta.url), "utf8");
  const experience = readFileSync(new URL("../components/maintenance/MaintenanceExperience.tsx", import.meta.url), "utf8");
  const avatar = readFileSync(new URL("../components/AccountAvatar.tsx", import.meta.url), "utf8");
  const profileForm = readFileSync(new URL("../components/profile/ProfileForm.tsx", import.meta.url), "utf8");
  assert.match(editor, /previousFocus\?\.focus\(\)/);
  assert.match(editor, /event\.key === "Escape" && !busy/);
  assert.match(editor, /event\.key !== "Tab"/);
  assert.match(editor, /document\.body\.style\.overflow = "hidden"/);
  assert.match(editor, /aria-expanded=\{advancedOpen\}/);
  assert.match(editor, /advancedOpen \? \(/);
  assert.match(editor, /setAdvancedOpen\(isAdvanced\)/);
  assert.match(editor, /setConfirmation\(null\)[\s\S]*Add a title and short message/);
  assert.match(experience, /maintenanceIcons/);
  assert.match(experience, /status=\{settings\.maintenance_status\}/);
  assert.match(experience, /inFlight/);
  assert.match(experience, /AbortController/);
  assert.match(experience, /controller\?\.abort\(\)/);
  assert.match(experience, /document\.visibilityState !== "visible"/);
  assert.match(avatar, /identity\.avatarUrls\.find/);
  assert.match(avatar, /onError=\{\(\) => setFailedUrls/);
  assert.doesNotMatch(profileForm, /Avatar URL/);
  assert.match(profileForm, /AvatarPicker/);
  assert.match(profileForm, /router\.refresh\(\)/);
  for (const path of ["../components/AppNavClient.tsx", "../components/admin/AdminShell.tsx", "../app/(public)/dashboard/page.tsx", "../app/(public)/profile/page.tsx", "../components/settings/AccountSettingsForm.tsx"]) {
    assert.match(readFileSync(new URL(path, import.meta.url), "utf8"), /AccountAvatar/);
  }
});
