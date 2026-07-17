import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { availableLessons, courses, findLesson, getLessonHref, playableCourse } from "../lib/learning/catalog.ts";
import { validateLessonFiles } from "../lib/validation/lesson-validation.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("catalog exposes one playable course and clear future course states", () => {
  assert.equal(courses.filter((course) => course.status === "available").length, 1);
  assert.equal(playableCourse.title, "Web Development Foundations");
  assert.deepEqual(playableCourse.modules.map((module) => module.title), ["Introduction", "HTML Basics", "CSS Basics", "JavaScript Basics"]);
  assert.equal(availableLessons.length, 3);
  assert.ok(courses.filter((course) => course.status === "coming_soon").some((course) => course.title === "React"));
});

test("first three lessons contain real content, files, tasks, and navigation", () => {
  for (const lesson of availableLessons) {
    assert.ok(lesson.explanation.length >= 3);
    assert.ok(lesson.objectives.length >= 4);
    assert.ok(lesson.tasks.length >= 3);
    assert.deepEqual(lesson.starterFiles.map((file) => file.name), ["index.html", "styles.css", "script.js"]);
    assert.ok(lesson.validationRules.length >= 3);
    assert.equal(lesson.quiz.status, "coming_soon");
  }
  const location = findLesson("web-development-foundations", "html-basics", "creating-your-first-web-page");
  assert.equal(location?.previous?.lessonSlug, "what-is-html");
  assert.equal(location?.next?.lessonSlug, "headings-paragraphs-and-text");
  assert.equal(getLessonHref("web-development-foundations", "introduction", "what-is-html"), "/learn/web-development-foundations/introduction/what-is-html");
});

test("validation checks semantic element counts, attributes, and normalized text", () => {
  const result = validateLessonFiles({
    "index.html": `<!doctype html><html lang="en"><head><title>My learning journal</title></head><body><h1>My learning journal</h1><p>First paragraph</p><p>Second paragraph</p></body></html>`,
    "styles.css": "main { color: red; }",
    "script.js": ""
  }, [
    { type: "html_attribute", tag: "html", attribute: "lang", value: "en", message: "language" },
    { type: "html_element", tag: "p", minimum: 2, message: "paragraphs" },
    { type: "required_text", text: "my   learning journal", file: "index.html", message: "journal" },
    { type: "css_declaration", property: "color", value: "red", message: "color" }
  ]);
  assert.equal(result.passed, true);
  assert.equal(result.checks.every((check) => check.passed), true);
});

test("workspace lazy-loads Monaco and preview and keeps learner code sandboxed", () => {
  const workspace = read("../components/learning/LearningWorkspace.tsx");
  const preview = read("../components/preview/LivePreview.tsx");
  const editor = read("../components/editor/MonacoCodeEditor.tsx");
  const packageJson = read("../package.json");
  assert.match(workspace, /dynamic\(\(\) => import\("@\/components\/editor\/MonacoCodeEditor"\)/);
  assert.match(workspace, /dynamic\(\(\) => import\("@\/components\/preview\/LivePreview"\)/);
  assert.match(editor, /@monaco-editor\/react/);
  assert.match(editor, /editor\.action\.formatDocument/);
  assert.match(editor, /ArrowLeft.*ArrowRight.*Home.*End/);
  assert.match(editor, /tabIndex=\{item\.name === file\.name \? 0 : -1\}/);
  assert.match(packageJson, /"monaco-editor"/);
  assert.match(preview, /sandbox="allow-scripts"/);
  assert.doesNotMatch(preview, /allow-same-origin/);
  assert.match(preview, /Content-Security-Policy/);
  assert.match(preview, /event\.source !== iframeRef\.current\?\.contentWindow/);
  assert.match(preview, /unhandledrejection/);
});

test("autosave is debounced, cancellable, restorable, and reset requires confirmation", () => {
  const workspace = read("../components/learning/LearningWorkspace.tsx");
  const api = read("../app/api/learning/progress/route.ts");
  assert.match(workspace, /window\.setTimeout\(\(\) => \{ void save\(false\); \}, 1_200\)/);
  assert.match(workspace, /abortRef\.current\?\.abort\(\)/);
  assert.match(workspace, /restoredFiles\[file\.name\] \?\? file\.content/);
  assert.match(workspace, /window\.confirm\("Reset every lesson file/);
  assert.match(workspace, /Saving…/);
  assert.match(workspace, /Saved just now/);
  assert.match(api, /isSameOriginMutation/);
  assert.match(api, /save_lesson_workspace/);
  assert.match(api, /Cache-Control.*no-store/);
  assert.match(read("../lib/progress/input.ts"), /location\.lesson\.starterFiles\.filter/);
});

test("learning migration is forward-only, seeded, indexed, and owner scoped", () => {
  const migration = read("../supabase/migrations/202607170004_learning_workspace_foundation.sql");
  for (const table of ["courses", "course_modules", "lessons", "lesson_progress", "lesson_code"]) assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /auth\.uid\(\) = user_id/g);
  assert.match(migration, /lesson_progress_user_recent_idx/);
  assert.match(migration, /create or replace function public\.save_lesson_workspace/);
  assert.match(migration, /security definer/);
  assert.match(migration, /current_user_id uuid := auth\.uid\(\)/);
  assert.match(migration, /jsonb_array_elements\(target_starter_files\)/);
  assert.match(migration, /revoke all on function public\.save_lesson_workspace/);
  assert.equal((migration.match(/insert into public\.courses/g) ?? []).length, 1);
  assert.equal((migration.match(/'33333333-3333-4333-8333-33333333330[1-3]'/g) ?? []).length >= 3, true);
  assert.doesNotMatch(migration, /service_role/);
});

test("dashboard uses persisted progress and recommendation hooks without fake learner stats", () => {
  const dashboard = read("../app/(public)/dashboard/page.tsx");
  assert.match(dashboard, /getLearningSummary/);
  assert.match(dashboard, /recommendNextLesson/);
  assert.match(dashboard, /Recently completed/);
  assert.doesNotMatch(dashboard, /4-day streak|71% avg|2 projects/);
});
