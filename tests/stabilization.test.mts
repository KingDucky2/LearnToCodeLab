import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { classifyMaintenancePath, getAutomaticMaintenanceStage } from "../lib/maintenance.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("profile edits use one authenticated atomic database transaction", () => {
  const api = read("../app/api/profile/route.ts");
  const migration = read("../supabase/migrations/202607170003_profile_ui_maintenance_stabilization.sql");
  assert.match(api, /rpc\("save_learner_profile"/);
  assert.doesNotMatch(api, /from\("profiles"\)\.update/);
  assert.match(migration, /create or replace function public\.save_learner_profile/);
  assert.match(migration, /current_user_id uuid := auth\.uid\(\)/);
  assert.match(migration, /on conflict \(user_id\) do update/);
  assert.match(migration, /delete from public\.learning_goals where user_id = current_user_id/);
  assert.doesNotMatch(migration, /update public\.profiles set[\s\S]{0,500}role\s*=/i);
});

test("profile reads tolerate an unapplied optional migration and explain setup failures", () => {
  const page = read("../app/(public)/profile/page.tsx");
  const api = read("../app/api/profile/route.ts");
  assert.match(page, /expandedProfile\.error/);
  assert.match(page, /select\("display_name,username,avatar_url,bio/);
  assert.match(api, /\["42703", "42883", "PGRST202"\]/);
  assert.match(api, /latest Supabase migration/);
});

test("avatar upload validates bytes, dimensions, ownership, and narrow formats", () => {
  const api = read("../app/api/profile/avatar/route.ts");
  const picker = read("../components/profile/AvatarPicker.tsx");
  const migration = read("../supabase/migrations/202607170003_profile_ui_maintenance_stabilization.sql");
  const storageFoundation = read("../supabase/migrations/202607170002_profile_onboarding_polish.sql");
  for (const format of ["image/jpeg", "image/png", "image/webp"]) assert.match(api, new RegExp(format.replace("/", "\\/")));
  assert.doesNotMatch(api, /image\/gif/);
  assert.doesNotMatch(picker, /image\/gif/);
  assert.match(api, /imageDimensions/);
  assert.match(api, /maxDimension = 4096/);
  assert.match(api, /randomUUID/);
  assert.match(storageFoundation, /storage\.foldername\(name\)/);
  assert.match(migration, /allowed_mime_types = array\['image\/jpeg','image\/png','image\/webp'\]/);
});

test("maintenance presets and automation remain editable, bounded, and auditable", () => {
  const form = read("../components/admin/MaintenanceAdminForm.tsx");
  const migration = read("../supabase/migrations/202607170003_profile_ui_maintenance_stabilization.sql");
  for (const label of ["Quick Restart", "Scheduled Maintenance", "Emergency Maintenance", "Database Maintenance", "Database Upgrade", "API Maintenance", "Server Maintenance", "Security Update", "Performance Upgrade", "New Feature Deployment", "Bug Fix Deployment", "Full System Upgrade"]) assert.match(form, new RegExp(label));
  assert.match(form, /Custom maintenance/);
  assert.match(form, /automatic_progress/);
  assert.match(form, /scheduled_start_at/);
  assert.match(form, /Set duration from now/);
  assert.match(migration, /least\(90/);
  assert.match(migration, /maintenance_automation_milestones/);
  assert.match(migration, /primary key \(event_id, milestone\)/);
  assert.match(migration, /maintenance_history/);
  assert.match(migration, /when was_enabled and not next_enabled then null/);
  assert.match(form, /Schedule maintenance mode\?/);
  assert.equal(getAutomaticMaintenanceStage(0), "Preparing systems");
  assert.equal(getAutomaticMaintenanceStage(25), "Maintenance is underway");
  assert.equal(getAutomaticMaintenanceStage(75), "Final checks are being completed");
  assert.equal(getAutomaticMaintenanceStage(90), "Services are preparing to return online");
});

test("maintenance cron is server-only, authenticated, and bypasses maintenance lookups", () => {
  const cron = read("../app/api/cron/maintenance/route.ts");
  const vercel = read("../vercel.json");
  assert.match(cron, /process\.env\.CRON_SECRET/);
  assert.match(cron, /Bearer \$\{secret\}/);
  assert.match(cron, /createAdminClient/);
  assert.doesNotMatch(cron, /NEXT_PUBLIC_SUPABASE_SERVICE/);
  assert.match(vercel, /api\/cron\/maintenance/);
  assert.equal(classifyMaintenancePath("/api/cron/maintenance").bypassMaintenance, true);
  assert.equal(classifyMaintenancePath("/api/cron/maintenance").refreshSession, false);
});

test("account menus close predictably and use the shared layering scale", () => {
  const nav = read("../components/AppNavClient.tsx");
  const admin = read("../components/admin/AdminShell.tsx");
  const styles = read("../app/globals.css");
  assert.match(nav, /document\.addEventListener\("pointerdown", closeAccountMenu\)/);
  assert.match(nav, /event\.key !== "Escape"/);
  assert.match(admin, /document\.addEventListener\("pointerdown", close\)/);
  for (const layer of ["layer-nav", "layer-dropdown", "layer-overlay", "layer-toast"]) assert.match(styles, new RegExp(`\\.${layer}`));
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
