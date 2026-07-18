import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const initial = read("../supabase/migrations/202607100001_initial_platform_schema.sql");
const migration = read("../supabase/migrations/202607170004_learning_workspace_foundation.sql");

test("workspace migration recognizes the pre-existing lessons and progress tables", () => {
  assert.match(initial, /create table if not exists public\.lessons[\s\S]*?module_id uuid not null references public\.modules/);
  assert.match(initial, /create table if not exists public\.lesson_progress[\s\S]*?completed_sections jsonb/);
  assert.doesNotMatch(initial, /last_opened_at/);
  assert.doesNotMatch(initial, /completion_percent/);
  assert.match(migration, /alter table public\.lesson_progress[\s\S]*?add column if not exists completion_percent/);
  assert.match(migration, /add column if not exists last_opened_at/);
});

test("every new lesson column is added before seeds and workspace functions", () => {
  const alterPosition = migration.indexOf("alter table public.lessons\n  add column if not exists objective");
  const seedPosition = migration.indexOf("insert into public.lessons(id, module_id");
  const functionPosition = migration.indexOf("create or replace function public.save_lesson_workspace");
  assert.ok(alterPosition > -1 && alterPosition < seedPosition && seedPosition < functionPosition);
  for (const column of ["objective", "subtitle", "description", "objectives", "content", "starter_files", "validation_rules", "xp_reward", "published", "updated_at"]) {
    assert.match(migration, new RegExp(`add column if not exists ${column}\\b`));
  }
  assert.match(migration, /alter column objective set default ''[\s\S]*?insert into public\.lessons/);
});

test("progress columns exist before indexes, RPC writes, and application reads", () => {
  const addLastOpened = migration.indexOf("add column if not exists last_opened_at");
  const recentIndex = migration.indexOf("lesson_progress_user_recent_idx");
  const rpcWrite = migration.indexOf("insert into public.lesson_progress(user_id, lesson_id, status, completion_percent, completed_at, last_opened_at)");
  assert.ok(addLastOpened > -1 && addLastOpened < recentIndex && recentIndex < rpcWrite);
  for (const column of ["status", "completion_percent", "completed_at", "last_opened_at", "updated_at"]) {
    assert.match(read("../lib/progress/server.ts") + read("../lib/types.ts"), new RegExp(column));
  }
});

test("legacy module relationships are preserved before the lesson foreign key changes", () => {
  const legacyModules = migration.indexOf("insert into public.course_modules(id, course_id, slug, title, description, status, sort_order, published)\nselect m.id");
  const foreignKeyDrop = migration.indexOf("pg_get_constraintdef(constraint_record.oid) like 'FOREIGN KEY (module_id)%'");
  const replacement = migration.indexOf("add constraint lessons_course_module_id_fkey");
  assert.ok(legacyModules > -1 && legacyModules < foreignKeyDrop && foreignKeyDrop < replacement);
  assert.match(migration, /update public\.lessons l[\s\S]*?where exists \(select 1 from public\.modules legacy_module/);
  assert.match(migration, /validate constraint lessons_course_module_id_fkey/);
});

test("a partial SQL Editor run can safely rerun the corrected migration", () => {
  assert.match(migration, /^--[^\n]*\n\nbegin;/);
  assert.match(migration, /commit;\s*$/);
  for (const table of ["courses", "course_modules", "lessons", "lesson_progress", "lesson_code"]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(migration, /create index if not exists lesson_progress_user_recent_idx/);
  assert.match(migration, /drop policy if exists "Published lessons are readable"/);
  assert.match(migration, /create or replace function public\.save_lesson_workspace/);
  assert.match(migration, /on conflict \(id\) do update/g);
  assert.doesNotMatch(migration, /drop table|truncate table/i);
});
