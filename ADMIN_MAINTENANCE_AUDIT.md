# Admin and maintenance audit

## Findings before the redesign

- Admin pages rendered inside the public navigation shell. The sticky public header remained visible above long maintenance controls, while the page also used a sticky bottom save button that could cover nearby content.
- The maintenance editor was one client component and one continuous form. Message, access, scheduling, task, update, preview, and recovery concerns had no task-focused navigation.
- Adding a task inserted the title `New task`; adding an update inserted `Maintenance update`. Deletes were immediate and had no confirmation. There was no discard action or browser navigation warning.
- The overview queried only two maintenance fields and presented unrelated future product cards instead of real maintenance tasks and updates.
- `AppNav`, admin guards, the maintenance page, and preview each performed their own user/profile work. The same authenticated user and role could be fetched twice in one server render.
- Middleware requested public maintenance state before checking bypass paths. The one-second cache limited database traffic inside a process, but recovery/auth/status routes still entered an unnecessary maintenance lookup path.
- Login and signup repeated an authenticated-user lookup already enforced by middleware.
- Alias pages duplicated redirect implementations and discarded query parameters.
- Admin settings and preview selected all `site_settings` columns. Only the columns used by each page are now selected.
- Public polling continued while the document was hidden. Countdown values were clamped but the expired state read as an indefinite status check. Update times were fixed to UTC instead of visitor-local time.
- Public task progress bars lacked task-specific progress semantics. The stored `delayed` task status did not match the requested public vocabulary.

## Canonical route map

| Canonical route | Purpose | Alias or notes |
| --- | --- | --- |
| `/admin` | Admin overview | Admin/owner only; unauthenticated staff go to recovery sign-in |
| `/admin/maintenance` | Maintenance editor | Admin/owner only |
| `/admin/maintenance/preview` | Protected saved-data preview | Admin/owner only; not a public bypass |
| `/staff/sign-in` | Staff recovery sign-in | Always excluded from maintenance lockout |
| `/login` | Learner sign-in | `/auth/sign-in` redirects here and preserves query parameters |
| `/signup` | Account creation | `/auth/create-account` redirects here and preserves query parameters |
| `/forgot-password` | Password reset request | `/auth/forgot-password` redirects here and preserves query parameters |
| `/reset-password` | Password update | `/auth/reset-password` redirects here and preserves query parameters |
| `/auth/callback` | OAuth and recovery code exchange | Always excluded from maintenance lockout |
| `/auth/continue` | Server-verified post-auth routing | Always excluded from maintenance lockout |
| `/auth/sign-out` | Sign out | Always excluded from maintenance lockout |
| `/maintenance` | Public maintenance experience | Always excluded to prevent loops |

Aliases use temporary framework redirects because they are compatibility routes and their future lifetime is not guaranteed. `next` values remain inert query data until the canonical route sanitizes them. Same-origin path validation rejects absolute, protocol-relative, backslash, CR, and LF targets.

## Architecture after the redesign

- `AdminShell` owns the desktop sidebar, mobile drawer, top bar, breadcrumb, role badge, account menu, and active navigation. Only Overview and Maintenance are presented because those are the only implemented admin areas.
- Route groups separate the minimal root layout, the public navigation/footer layout, and the protected admin layout. Admin requests no longer render, query, or hydrate public navigation and no longer depend on CSS to hide it.
- `AdminPageHeader`, `AdminCard`, and `AdminStatusBadge` provide the small shared admin component layer. Editor-specific sections, fields, toggles, empty states, action bar, tabs, and confirmation dialog stay close to the editor rather than becoming a generic framework.
- `requireAdmin` and `getCurrentUserRole` use React request memoization. Public identity surfaces share one server user/profile result per render, while admin pages share the protected layout result. The query selects only role, display name, avatar, and preferred language.
- Admin pages still verify roles on the server. The save API independently verifies admin/owner access and the database RPC independently checks `auth.uid()` and `is_site_admin()` inside its transaction.
- Middleware uses `classifyMaintenancePath` before loading maintenance state. Static files and the public status endpoint skip both maintenance and session work. Session-sensitive auth/recovery bypass routes still run the Supabase cookie refresh without requesting maintenance data. The matcher is only the coarse Next.js fast path.
- The public maintenance RPC remains cached for one second. Saves clear the in-process cache and revalidate the root layout, public maintenance page, and editor. The polling status endpoint forces a refresh and returns `Cache-Control: no-store`.
- `resolveAccountIdentity` is the shared identity policy. It prefers a valid stored profile avatar, then provider identity metadata, then user metadata; image failures advance through those candidates before initials. Google connection state comes only from Supabase identities and is never used for authorization.

## Request and query impact

- Browser network requests on initial public maintenance load remain one document request; the status request begins only after the configured interval. Polling now pauses while hidden and checks once when visibility returns.
- Maintenance RPC calls were removed from every middleware pass for `/maintenance`, `/staff/sign-in`, auth callback/continue/reset routes, maintenance APIs, and excluded static assets.
- Public maintenance rendering removes up to three repeated Supabase operations for an authenticated visitor: global navigation and page personalization now share the same `getUser` and profile result, and the separate personalization profile query is gone.
- Admin maintenance rendering removes two repeated operations: the global navigation, admin layout, and page share the same `getUser` and profile query. Preview removes those two plus its separate profile query.
- The hardened admin layout removes the public navigation operation entirely from `/admin/*`; the remaining admin layout/page calls share the memoized server session and profile result.
- Login and signup no longer perform a second page-level `getUser`; middleware remains the canonical signed-in redirect check.
- Independent settings, tasks, and update reads remain parallel. The updater display-name lookup is dependent on `updated_by` and therefore remains sequential.

## Rendering and bundle measurements

Production builds were compared against detached `HEAD` using the same installed Next.js dependencies:

| Route | Before | After | Impact |
| --- | ---: | ---: | ---: |
| Shared first-load JS | 102 kB | 102 kB | no change |
| `/admin` first-load JS | 106 kB | 114 kB | +8 kB for responsive shell/navigation |
| `/admin/maintenance` first-load JS | 111 kB | 121 kB | +10 kB for tabs, draft lifecycle, dialogs, and editor UX |
| `/admin/maintenance/preview` | 116 kB | 116 kB | no change |
| `/maintenance` | 116 kB | 116 kB | no change |
| `/login` | 175 kB | 174 kB | -1 kB; route component 3.63 kB to 134 B |
| `/signup` | 175 kB | 174 kB | -1 kB |

The four query-preserving alias pages changed from static redirect output to small dynamic routes because they read request search parameters. Canonical login and signup remain static. Admin and maintenance routes remain dynamic; no previously static product page became dynamic.

The hardening build keeps shared first-load JS at 102 kB and `/admin` at 114 kB. `/admin/maintenance` is 122 kB (+1 kB for focus trapping and keyboard tab behavior), while preview and public maintenance remain 116 kB. Route size did not materially fall, but admin no longer executes the public `AppNav` server query or loads its public-layout chunk.

## Security and data integrity

- No authentication architecture, RLS policy, role source, service-role behavior, middleware maintenance decision, emergency override, or database save procedure was replaced.
- `MAINTENANCE_OVERRIDE`, legacy emergency mode, staff recovery, callback, continue, sign-out, password reset, static exclusions, admin/owner verification, one-second responsiveness, and atomic RPC saves remain in place.
- No migration or schema change was needed. Existing settings, task identifiers/order, updates, and stored `delayed` status are preserved. The UI labels `delayed` as “Paused” without rewriting stored values.
- Overall progress remains explicitly manual. It is not silently derived from tasks. The public explanation includes completed visible-task counts when tasks exist.
- React escapes public text output. The API continues to trim, bound, validate, and normalize titles, messages, email, dates, progress, identifiers, statuses, list counts, and refresh intervals.

## Known limitations and next phase

- Update categories and task-derived overall progress would require new schema fields and an additive migration; they were not simulated in client state or added destructively.
- The editor warns on browser unload and refresh. A custom in-app route-transition blocker was not added because Next App Router does not expose a stable general-purpose navigation interception API; all editor-owned links are explicit and the dirty action bar remains visible.
- Confirmation dialogs now set safe initial focus, trap focus, restore the trigger, block background scrolling, and close with Escape when no save is in progress. Tabs support Left, Right, Home, and End keys.
- The next phase should add browser-level interaction coverage with signed-in admin/owner/learner fixtures, then evaluate moving countdown and polling into a smaller client island to reduce hydration on the otherwise presentational public maintenance page.
- Avatar upload/storage management remains intentionally out of scope. Existing HTTPS profile avatar URLs and provider avatars are resolved safely, with runtime failure fallback.

## Future support and user-management extension points

- Add implemented admin areas to the typed navigation list in `AdminShell` only after their server routes and authorization policies exist. Do not add placeholder pages, statistics, or links.
- Keep the shared admin layout as the server authorization boundary for future Users, Support tickets, Account recovery, and Password-reset assistance routes. Sensitive APIs must independently repeat authorization, as the maintenance save API does now.
- Administrators must never view or receive passwords. Password assistance should initiate Supabase Auth reset-link flows on the server; service-role credentials must never be serialized to client components.
- Role changes must be narrowly authorized and audited. Destructive or sensitive account actions require explicit confirmation and an auditable server-side operation.

## Validation

- TypeScript type check: passed.
- ESLint: passed.
- Node test suite: 20 passed, 0 failed.
- Next.js production build: passed; 52 routes/pages generated or analyzed.
- `git diff --check`: passed.
- Responsive public maintenance review: 320, 375, 768, 1024, 1440, and 1920 CSS-pixel widths all reported matching document/client widths with no horizontal page overflow. The maintenance heading and neutral Staff sign in action remained present at every width.
- Visual review at 320 and 1440 confirmed single-column mobile stacking, readable controls, no global-navigation overlap, and the reduced-width desktop illustration/content balance.
- Signed-in role-specific admin interaction testing was not possible without local admin, owner, learner, and failure-mode fixtures. Server guards and source-level regression tests cover the authorization and editor contracts in this pass.
