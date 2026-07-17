import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync(new URL("../components/admin/AdminShell.tsx", import.meta.url), "utf8");
const quickActions = readFileSync(new URL("../components/admin/AdminQuickActions.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/(admin)/admin/layout.tsx", import.meta.url), "utf8");

test("admin interface mode defaults safely and persists per administrator", () => {
  assert.match(shell, /useState<AdminInterfaceMode>\("beginner"\)/);
  assert.match(shell, /ltcl:admin-interface-mode:\$\{user\.id\}/);
  assert.match(shell, /window\.localStorage\.getItem\(storageKey\)/);
  assert.match(shell, /window\.localStorage\.setItem\(storageKey, nextMode\)/);
  assert.match(layout, /id: admin\.user\.id/);
});

test("admin mode selector is accessible and available to nested client controls", () => {
  assert.match(shell, /aria-label="Administration interface mode"/);
  assert.match(shell, /aria-pressed=\{mode === "beginner"\}/);
  assert.match(shell, /aria-pressed=\{mode === "advanced"\}/);
  assert.match(shell, /export function useAdminInterfaceMode/);
  assert.match(shell, /data-admin-mode=\{mode\}/);
});

test("quick actions are contextual and retain keyboard focus behavior", () => {
  for (const route of ["/admin/support", "/admin/maintenance", "/admin/users", "/admin/activity"]) assert.match(quickActions, new RegExp(route.replaceAll("/", "\\/")));
  for (const action of ["View assigned tickets", "Preview maintenance page", "Find account for reset", "Recent activity", "Enable maintenance", "Disable maintenance", "Publish changes"]) assert.match(quickActions, new RegExp(action));
  assert.match(quickActions, /event\.key === "Escape"/);
  assert.match(quickActions, /firstLink\.current \?\? firstButton\.current/);
  assert.match(quickActions, /trigger\.current\?\.focus\(\)/);
  assert.match(quickActions, /aria-controls=\{menuId\}/);
  assert.match(quickActions, /ltcl:maintenance-action/);
  assert.match(quickActions, /onClick=\{closeMenu\}/);
});
