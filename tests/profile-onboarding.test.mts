import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getRoleBadgeLabel } from "../lib/roles.ts";
import { normalizeDisplayName, usernameComparisonKey, validateDisplayName, validateProfileUsername } from "../lib/profile-validation.ts";

test("usernames preserve capitalization but compare case-insensitively", () => {
  assert.equal(validateProfileUsername("Luke_G").valid, true);
  assert.equal(validateProfileUsername("KingDucky2").valid, true);
  assert.equal(validateProfileUsername("_Luke").valid, false);
  assert.equal(validateProfileUsername("Luke_").valid, false);
  assert.equal(validateProfileUsername("Luke__G").valid, false);
  assert.equal(validateProfileUsername("Luke-G").valid, false);
  assert.equal(validateProfileUsername("ADMIN").valid, false);
  assert.equal(usernameComparisonKey(" Luke_G "), "luke_g");
  assert.equal(validateProfileUsername(" Luke_G ").display, "Luke_G");
});

test("display names reject contact details and staff impersonation", () => {
  assert.equal(validateDisplayName("Luke Gray").valid, true);
  assert.equal(normalizeDisplayName("  Luke   Gray  "), "Luke Gray");
  for (const value of ["Admin Luke", "A.d.m.i.n", "LearnToCodeLab Staff", "Official Support", "owner", "user@example.com", "https://example.com"]) assert.equal(validateDisplayName(value).valid, false, value);
});

test("role badges come only from database roles and support future staff labels", () => {
  assert.equal(getRoleBadgeLabel("learner"), null);
  assert.equal(getRoleBadgeLabel("owner"), "Owner");
  assert.equal(getRoleBadgeLabel("admin"), "Admin");
  assert.equal(getRoleBadgeLabel("moderator"), "Moderator");
  assert.equal(getRoleBadgeLabel("support_staff"), "Support Staff");
  assert.equal(getRoleBadgeLabel("curriculum_editor"), "Curriculum Editor");
});

test("profile migration enforces identity and private avatar ownership", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202607170002_profile_onboarding_polish.sql", import.meta.url), "utf8");
  assert.match(migration, /lower\(username\)/);
  assert.match(migration, /char_length\(username\) between 3 and 20/);
  assert.match(migration, /username !~ '\(\^_\|_\$\|__\)'/);
  assert.match(migration, /is_safe_display_name/);
  assert.match(migration, /storage\.foldername\(name\)/);
  assert.match(migration, /file_size_limit/);
  assert.match(migration, /image\/jpeg/);
  assert.match(migration, /onboarding_required boolean not null default false/);
  assert.match(migration, /onboarding_required\)\s+values[\s\S]*true/);
  assert.match(migration, /complete_profile_onboarding/);
  assert.doesNotMatch(migration, /grant update \(.*role/i);
});

test("avatar and profile mutations validate on the server", () => {
  const avatar = readFileSync(new URL("../app/api/profile/avatar/route.ts", import.meta.url), "utf8");
  const profile = readFileSync(new URL("../app/api/profile/route.ts", import.meta.url), "utf8");
  assert.match(avatar, /5 \* 1024 \* 1024/);
  assert.match(avatar, /randomUUID/);
  assert.doesNotMatch(avatar, /avatar-\$\{file\.name\}/);
  assert.match(avatar, /image\/webp/);
  assert.match(profile, /validateDisplayName/);
  assert.match(profile, /validateProfileUsername/);
  assert.doesNotMatch(profile, /role:/);
});

test("required onboarding preserves recovery routes and exempts existing users", () => {
  const middleware = readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
  const continuation = readFileSync(new URL("../app/(public)/auth/continue/route.ts", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../supabase/migrations/202607170002_profile_onboarding_polish.sql", import.meta.url), "utf8");
  assert.match(middleware, /onboardingRequired && !onboardingCompleted/);
  assert.match(middleware, /isOnboardingExemptPath/);
  assert.match(continuation, /"\/onboarding"/);
  assert.match(migration, /default false/);
  assert.match(migration, /onboarding_required = false/);
});
