# LearnToCode Lab

An adaptive coding school by Luke Giordano, rebuilt as a Next.js + TypeScript platform with Supabase authentication, learner profiles, privacy controls, and Vercel deployment.

## Local Setup

```bash
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000/
```

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional server-only emergency maintenance fallback
MAINTENANCE_MODE=false
MAINTENANCE_TITLE=
MAINTENANCE_MESSAGE=
MAINTENANCE_ESTIMATED_RETURN=
```

Do not commit `.env.local`, Google credential JSON files, client secrets, service-role keys, or private credentials.

## Supabase Auth Configuration

Site URL:

```text
https://learntocodelab.com
```

Allowed redirect URLs:

```text
https://learntocodelab.com/**
https://www.learntocodelab.com/**
https://learntocodelab.vercel.app/**
http://localhost:3000/**
```

Google OAuth redirect URI:

```text
https://fjdwijneunzkghusabea.supabase.co/auth/v1/callback
```

Recommended Supabase email template links:

```text
Confirm signup: {{ .ConfirmationURL }}
Reset password: {{ .ConfirmationURL }}
Email change: {{ .ConfirmationURL }}
```

The app passes `/auth/callback` as the redirect target when it starts signup, OAuth, and reset flows. Confirm that generated email links ultimately return to `/auth/callback` on the LearnToCodeLab domain, then continue to `/dashboard`, `/reset-password`, or `/settings`.

## Database

Run migrations in order from `supabase/migrations`, then run `supabase/seed.sql` for starter curriculum and practice questions.

Current auth and settings migrations:

```text
supabase/migrations/202607120001_production_auth_profiles.sql
supabase/migrations/202607120002_settings_integrity.sql
supabase/migrations/202607130001_maintenance_system.sql
```

The profile trigger creates a private one-to-one `profiles` row from Supabase auth metadata. The settings migration persists display preferences and tightens the insert/update ownership policies. Row Level Security only allows authenticated users to access their own private account data.

## Maintenance Control System

Normal maintenance is stored in Supabase and can be changed without deploying:

```text
/admin
/admin/maintenance
/admin/maintenance/preview
/maintenance
```

The editor controls public copy, progress, return time, task statuses, updates, personalization, login availability, user bypass, refresh timing, and support details. Enabling maintenance requires confirmation. Public visitors receive a temporary `307` redirect with a `Retry-After` header, while required recovery and authentication routes remain available.

Assign the first owner in the Supabase SQL editor after replacing the example email:

```sql
update public.profiles
set role = 'owner'
where id = (select id from auth.users where email = 'owner@example.com');
```

Allowed roles are `learner`, `user`, `moderator`, `admin`, and `owner`. Only `admin` and `owner` can use maintenance controls. Authorization is checked server-side and enforced again by RLS.

Emergency mode takes priority when `MAINTENANCE_MODE=true` in Vercel. It works when Supabase is unavailable, disables bypass, and may use the optional title, message, and ISO timestamp variables. Vercel environment changes require a redeployment.

Recovery order:

1. Open `/admin/maintenance` and disable the Supabase switch.
2. If emergency mode is active, set `MAINTENANCE_MODE=false` in Vercel and redeploy.
3. If the Next.js deployment is unavailable, upload `maintenance.html` as `index.html` to a static host.

## Auth Routes

```text
/login
/signup
/forgot-password
/reset-password
/auth/callback
/dashboard
/profile
/settings
```

Legacy routes under `/auth/sign-in`, `/auth/create-account`, `/auth/forgot-password`, and `/auth/reset-password` redirect to the new routes.

## Delete Account

The delete-account UI and server route are implemented. Deleting the Supabase auth user requires this server-only Vercel environment variable:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose that key in browser code and never prefix it with `NEXT_PUBLIC_`.

## Deployment

- Source code lives on GitHub.
- Vercel deploys preview and production environments automatically.
- Configure `LearnToCodeLab.com` and `www.LearnToCodeLab.com` in Vercel.
- Store Supabase public variables separately for preview and production.

## Auth Testing Checklist

- Create an email/password account.
- Receive the confirmation email.
- Confirm the account and land back on LearnToCodeLab.
- Sign in with email/password.
- Refresh and remain signed in.
- Log out.
- Request a password-reset email.
- Reset the password.
- Sign in with the new password.
- Sign in with Google.
- Cancel Google login and return safely to `/login`.
- Access `/dashboard` while logged out and confirm redirect to `/login`.
- Access `/login` while logged in and confirm redirect to `/dashboard`.
- Confirm profile creation after email signup.
- Confirm profile creation after Google signup.
- Confirm one user cannot read another user’s private profile.
- Confirm production build succeeds.

Maintenance page:

- `maintenance.html` is the standalone emergency artifact and contains no private credentials.
- For a static-host fallback, upload it as `index.html`.
- To show its countdown, set the `maintenance-return` meta value to an ISO date before uploading.
- The integrated Next.js page is controlled from `/admin/maintenance`.

## Maintenance Testing Checklist

- Confirm the site works normally while maintenance is disabled.
- Enable maintenance and confirm signed-out visits redirect without looping.
- Confirm static images and Next.js assets remain available.
- Confirm login follows the configured availability setting.
- Confirm OAuth callback, password reset, sign-out, and admin routes remain reachable.
- Confirm a learner cannot access `/admin` or update maintenance tables.
- Confirm an admin can bypass when enabled and can always reach the editor.
- Confirm preview renders saved content without enabling maintenance.
- Confirm hidden tasks and updates remain private.
- Confirm progress, countdown, dark theme, mobile layout, reduced motion, and automatic reopening.
- Confirm `MAINTENANCE_MODE=true` overrides Supabase and works if Supabase is unavailable.
- Confirm disabling maintenance returns visitors to their safe original route.
