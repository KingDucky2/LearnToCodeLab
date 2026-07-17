import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("public header geometry is shared by sticky positioning and scroll clearance", () => {
  const styles = read("../app/globals.css");
  const nav = read("../components/AppNavClient.tsx");
  const shell = read("../components/PageShell.tsx");
  assert.match(styles, /--app-header-height:/);
  assert.match(styles, /--app-header-sticky-top:/);
  assert.match(styles, /--app-header-clearance:/);
  assert.match(styles, /scroll-padding-top: var\(--app-header-clearance\)/);
  assert.match(styles, /scroll-margin-top: var\(--app-header-clearance\)/);
  assert.match(styles, /env\(safe-area-inset-top\)/);
  assert.match(nav, /app-header layer-nav sticky/);
  assert.doesNotMatch(nav, /sticky top-[23]/);
  assert.match(shell, /page-shell/);
});

test("account dropdown stays bounded and supports predictable dismissal", () => {
  const styles = read("../app/globals.css");
  const nav = read("../components/AppNavClient.tsx");
  assert.match(styles, /width: min\(18rem, calc\(100vw - 2rem\)\)/);
  assert.match(styles, /max-height: calc\(100dvh - var\(--app-header-clearance\) - 1rem\)/);
  assert.match(styles, /overflow-y: auto/);
  assert.match(styles, /overscroll-behavior: contain/);
  assert.match(nav, /aria-controls="account-navigation-menu"/);
  assert.match(nav, /aria-haspopup="true"/);
  assert.match(nav, /document\.addEventListener\("pointerdown", closeAccountMenu\)/);
  assert.match(nav, /event\.key !== "Escape"/);
  assert.match(nav, /querySelector<HTMLElement>\("summary"\)\?\.focus\(\)/);
  assert.match(nav, /detailsRef\.current\.open = false/);
});

test("account trigger preserves high-priority content without crowding navigation", () => {
  const nav = read("../components/AppNavClient.tsx");
  assert.match(nav, /max-w-\[13rem\]/);
  assert.match(nav, /xl:max-w-\[18rem\]/);
  assert.match(nav, /min-w-16 flex-1 truncate/);
  assert.match(nav, /hidden shrink-0 xl:inline-flex/);
  assert.match(nav, /AccountAvatar/);
});

test("mobile navigation closes with Escape and restores trigger focus", () => {
  const nav = read("../components/AppNavClient.tsx");
  assert.match(nav, /ref=\{mobileMenuButtonRef\}/);
  assert.match(nav, /if \(event\.key !== "Escape"\) return/);
  assert.match(nav, /setMenuOpen\(false\)/);
  assert.match(nav, /mobileMenuButtonRef\.current\?\.focus\(\)/);
});

test("learning catalog waits for comfortable width before using two columns", () => {
  const catalog = read("../app/(public)/learn/page.tsx");
  const path = read("../app/(public)/learn/[language]/page.tsx");
  const lesson = read("../app/(public)/learn/[language]/[lesson]/page.tsx");
  assert.match(catalog, /min-\[900px\]:grid-cols-2/);
  assert.match(path, /min-\[900px\]:grid-cols-2/);
  assert.doesNotMatch(catalog, /md:grid-cols-2/);
  assert.doesNotMatch(path, /md:grid-cols-2/);
  assert.match(catalog, /content-wrap block min-w-0/);
  assert.match(path, /content-wrap block min-w-0/);
  assert.match(lesson, /xl:grid-cols-\[minmax\(0,\.75fr\)_minmax\(0,1\.25fr\)\]/);
  assert.match(lesson, /overflow-x-auto whitespace-pre-wrap break-words/);
});

test("full-height application surfaces use dynamic viewport units", () => {
  const admin = read("../components/admin/AdminShell.tsx");
  const maintenance = read("../components/maintenance/MaintenanceExperience.tsx");
  const styles = read("../app/globals.css");
  assert.match(admin, /min-h-dvh/);
  assert.match(admin, /lg:h-dvh/);
  assert.match(maintenance, /min-h-dvh/);
  assert.match(maintenance, /calc\(100dvh-2\.5rem\)/);
  assert.match(styles, /calc\(100svh - var\(--app-header-clearance\)\)/);
  assert.match(styles, /calc\(100dvh - var\(--app-header-clearance\)\)/);
});

test("important support subjects wrap instead of silently truncating", () => {
  const support = read("../app/(admin)/admin/support/page.tsx");
  assert.match(support, /content-wrap min-w-0 font-black text-foreground/);
  assert.doesNotMatch(support, /truncate font-black text-foreground">#\{ticket\.ticket_number\}/);
});
