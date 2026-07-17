import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canManageAccount, canSuspendAccount, normalizeAdminSearch } from "../lib/admin-security.ts";
import { isSupportStatus, validateSupportMessage, validateSupportTicket } from "../lib/support.ts";
import { isSameOriginMutation } from "../lib/request-security.ts";

test("account-management rules preserve owner and staff safeguards", () => {
  assert.equal(canManageAccount({ actorId: "owner-1", actorRole: "owner", targetId: "admin-1", targetRole: "admin" }), true);
  assert.equal(canManageAccount({ actorId: "admin-1", actorRole: "admin", targetId: "admin-2", targetRole: "admin" }), false);
  assert.equal(canManageAccount({ actorId: "admin-1", actorRole: "admin", targetId: "owner-1", targetRole: "owner" }), false);
  assert.equal(canSuspendAccount({ actorId: "owner-1", actorRole: "owner", targetId: "owner-1", targetRole: "owner" }), false);
  assert.equal(canSuspendAccount({ actorId: "admin-1", actorRole: "admin", targetId: "learner-1", targetRole: "learner" }), true);
});

test("mutation origin checks reject cross-site requests", () => {
  assert.equal(isSameOriginMutation(new Request("https://learntocodelab.com/api/support/tickets", { method: "POST", headers: { origin: "https://learntocodelab.com" } })), true);
  assert.equal(isSameOriginMutation(new Request("https://learntocodelab.com/api/support/tickets", { method: "POST", headers: { origin: "https://evil.example" } })), false);
});

test("support input is bounded and rejects external diagnostic locations", () => {
  assert.equal(validateSupportTicket({ subject: "Need help", category: "login_account", message: "I cannot access my saved lessons.", pageUrl: "/dashboard" }).ok, true);
  assert.equal(validateSupportTicket({ subject: "Need help", category: "unknown", message: "I cannot access my saved lessons." }).ok, false);
  assert.equal(validateSupportTicket({ subject: "Need help", category: "login_account", message: "I cannot access my saved lessons.", pageUrl: "https://evil.example/token" }).ok, false);
  assert.equal(validateSupportMessage("ok").ok, true);
  assert.equal(validateSupportMessage("x").ok, false);
  assert.equal(isSupportStatus("waiting_on_user"), true);
  assert.equal(isSupportStatus("deleted"), false);
  assert.equal(normalizeAdminSearch("user@example.com,(x)"), "user@example.comx");
});

test("support migration is narrow, append-only, and protects privileged profile fields", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202607160001_admin_support_system.sql", import.meta.url), "utf8");
  for (const table of ["support_tickets", "support_messages", "support_staff_notes", "user_staff_notes", "account_status_history", "admin_audit_log"]) assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  assert.match(migration, /revoke update on public\.profiles from authenticated/);
  assert.match(migration, /grant update \(display_name, username, avatar_url/);
  assert.match(migration, /target_role = 'owner'/);
  assert.match(migration, /target_user_id = auth\.uid\(\)/);
  assert.match(migration, /delete from auth\.sessions/);
  assert.match(migration, /create_support_ticket/);
  assert.match(migration, /A matching support request is already open/);
  assert.match(migration, /touch_support_ticket_from_message/);
  assert.match(migration, /needs_staff_attention = \(new\.author_kind = 'learner'\)/);
  assert.match(migration, /close_own_support_ticket/);
  assert.match(migration, /target\.role <> 'owner'/);
  assert.match(migration, /Staff read private notes" on public\.support_staff_notes\s+for select to authenticated using \(public\.is_site_admin\(\)\)/);
  assert.doesNotMatch(migration, /create policy[^;]+on public\.admin_audit_log\s+for (update|delete)/i);
});

test("service role stays in a server-only module and sensitive operations are audited", () => {
  const adminClient = readFileSync(new URL("../lib/supabase/admin.ts", import.meta.url), "utf8");
  const accountRoute = readFileSync(new URL("../app/api/admin/users/[userId]/actions/route.ts", import.meta.url), "utf8");
  assert.match(adminClient, /import "server-only"/);
  assert.match(adminClient, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(adminClient, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE/);
  assert.match(accountRoute, /writeAdminAudit/);
  assert.match(accountRoute, /resetPasswordForEmail/);
  assert.match(accountRoute, /10 \* 60_000/);
  assert.match(accountRoute, /admin_revoke_user_sessions/);
  assert.doesNotMatch(accountRoute, /generateLink/);
  assert.doesNotMatch(accountRoute, /password\s*:/i);
});

test("admin navigation exposes only implemented support-system pages", () => {
  const shell = readFileSync(new URL("../components/admin/AdminShell.tsx", import.meta.url), "utf8");
  for (const route of ["/admin/users", "/admin/support", "/admin/maintenance", "/admin/activity"]) assert.match(shell, new RegExp(route));
  for (const route of ["app/(admin)/admin/users/page.tsx", "app/(admin)/admin/support/page.tsx", "app/(admin)/admin/activity/page.tsx"]) assert.match(readFileSync(new URL(`../${route}`, import.meta.url), "utf8"), /AdminPageHeader/);
});

test("user and ticket indexes remain server-paginated and ownership-scoped", () => {
  const users = readFileSync(new URL("../app/(admin)/admin/users/page.tsx", import.meta.url), "utf8");
  const learnerTicket = readFileSync(new URL("../app/(public)/support/[ticketId]/page.tsx", import.meta.url), "utf8");
  const learnerReply = readFileSync(new URL("../app/api/support/tickets/[ticketId]/messages/route.ts", import.meta.url), "utf8");
  assert.match(users, /pageSize = 20/);
  assert.match(users, /\.range\(\(page - 1\) \* pageSize/);
  assert.match(users, /getUserById/);
  assert.match(users, /last_sign_in_at/);
  assert.match(learnerTicket, /\.eq\("user_id", user\.id\)/);
  assert.match(learnerReply, /\.eq\("user_id", user\.id\)/);
});

test("suspended accounts retain support and recovery access but not protected routes", () => {
  const middleware = readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
  const maintenance = readFileSync(new URL("../lib/maintenance.ts", import.meta.url), "utf8");
  assert.match(middleware, /accountStatus === "suspended"/);
  assert.match(middleware, /isSuspendedAccountAllowedPath/);
  assert.match(middleware, /redirectUrl\.pathname = "\/support"/);
  assert.match(maintenance, /"\/api\/support"/);
  assert.match(maintenance, /"\/support"/);
});
